package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.persistence.Lookups;
import com.hub.reservehub.common.storage.UploadedFiles;
import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Platform opening flow: anyone signed in applies with a business registration certificate →
 * a service ADMIN approves (the Platform is created and the applicant becomes its owner) or rejects with a reason.
 * 플랫폼 개설 흐름: 로그인한 누구나 사업자등록증을 첨부해 신청 → 서비스 운영자(ADMIN)가 승인하면 플랫폼이
 * 만들어지고 신청자가 오너가 된다. 반려할 땐 사유를 남긴다.
 */
@Service
public class PlatformApplicationService {

    // 등록증은 사람이 눈으로 확인하는 문서라 PDF/이미지만 받는다 (스크립트가 들어갈 수 있는 html/svg 차단).
    private static final Set<String> CERTIFICATE_TYPES = Set.of("application/pdf", "image/png", "image/jpeg");

    private final PlatformApplicationRepository applicationRepository;
    private final PlatformService platformService;
    private final ActionLogger actionLogger;
    private final UserRepository userRepository;
    private final Path uploadsRoot;

    public PlatformApplicationService(
            PlatformApplicationRepository applicationRepository, PlatformService platformService,
            ActionLogger actionLogger, UserRepository userRepository,
            @Value("${app.uploads.dir:uploads}") String uploadsDir
    ) {
        this.applicationRepository = applicationRepository;
        this.platformService = platformService;
        this.actionLogger = actionLogger;
        this.userRepository = userRepository;
        this.uploadsRoot = Path.of(uploadsDir, "platform-applications");
    }

    public record ApplicationInput(
            String name, BusinessType businessType, @Nullable String phone, @Nullable String address,
            @Nullable String description, String businessNumber
    ) {
    }

    public record WithApplicant(PlatformApplication application, @Nullable User applicant) {
    }

    @Transactional
    public PlatformApplication submit(AuthenticatedUser actor, ApplicationInput input, @Nullable MultipartFile certificate) {
        if (actor.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("운영자 계정으로는 플랫폼을 신청할 수 없습니다.");
        }
        if (input.name() == null || input.name().isBlank()) {
            throw new IllegalArgumentException("플랫폼명을 입력해 주세요.");
        }
        String businessNumber = BusinessNumber.normalize(input.businessNumber());
        if (certificate == null || certificate.isEmpty()) {
            throw new IllegalArgumentException("사업자등록증 파일을 첨부해 주세요.");
        }
        String contentType = certificate.getContentType() == null ? "" : certificate.getContentType().toLowerCase(Locale.ROOT);
        if (!CERTIFICATE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("사업자등록증은 PDF, PNG, JPG 파일만 올릴 수 있습니다.");
        }
        // DB 부분 유니크 인덱스(uq_platform_application_pending)가 최종 방어선 — 여기선 친절한 메시지용으로 먼저 본다.
        if (applicationRepository.existsByBusinessNumberAndStatus(businessNumber, PlatformApplicationStatus.PENDING)) {
            throw new IllegalStateException("이 사업자등록번호로 심사 중인 신청이 이미 있습니다.");
        }

        Path stored = UploadedFiles.store(uploadsRoot.resolve(actor.getId().toString()), certificate);
        return applicationRepository.save(new PlatformApplication(
                actor.getId(), input.name().trim(), input.businessType(), blankToNull(input.phone()), blankToNull(input.address()),
                blankToNull(input.description()), businessNumber,
                certificate.getOriginalFilename() == null ? "certificate" : certificate.getOriginalFilename(),
                stored.toString(), contentType
        ));
    }

    @Transactional(readOnly = true)
    public List<PlatformApplication> listMine(AuthenticatedUser actor) {
        return applicationRepository.findByApplicantIdOrderByCreatedAtDesc(actor.getId());
    }

    @Transactional
    public void cancel(UUID applicationId, AuthenticatedUser actor) {
        PlatformApplication application = applicationRepository.getForUpdate(applicationId);
        if (!application.getApplicantId().equals(actor.getId())) {
            throw new AccessDeniedException("본인의 신청만 취소할 수 있습니다.");
        }
        application.cancel();
    }

    @Transactional(readOnly = true)
    public List<WithApplicant> listByStatus(AuthenticatedUser admin, PlatformApplicationStatus status) {
        requireAdmin(admin);
        List<PlatformApplication> applications = applicationRepository.findByStatusOrderByCreatedAtAsc(status);
        Map<UUID, User> users = Lookups.byId(
                userRepository.findAllById(applications.stream().map(PlatformApplication::getApplicantId).distinct().toList()), User::getId);
        return applications.stream().map(a -> new WithApplicant(a, users.get(a.getApplicantId()))).toList();
    }

    @Transactional
    // 행 잠금(getForUpdate)으로 두 관리자가 동시에 눌러도 플랫폼이 두 번 만들어지지 않게 한다.
    public Platform approve(UUID applicationId, AuthenticatedUser admin, @Nullable String memo) {
        requireAdmin(admin);
        PlatformApplication application = applicationRepository.getForUpdate(applicationId);
        if (application.getStatus() != PlatformApplicationStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 신청입니다.");
        }
        Platform platform = platformService.create(
                application.getApplicantId(), application.getName(), application.getBusinessType(),
                application.getPhone(), application.getAddress(), application.getDescription()
        );
        application.approve(admin.getId(), blankToNull(memo), platform.getId());
        actionLogger.log(platform.getId(), admin.getId(), ActionTarget.PLATFORM_CHANGE, platform.getId(), "APPROVE_OPENING",
                "플랫폼 개설 승인: '" + platform.getName() + "' — 신청자 " + LogMemo.who(userRepository.findById(application.getApplicantId()).orElse(null))
                        + ", 사업자번호 " + application.getBusinessNumber());
        return platform;
    }

    @Transactional
    public void reject(UUID applicationId, AuthenticatedUser admin, @Nullable String memo) {
        requireAdmin(admin);
        if (memo == null || memo.isBlank()) {
            throw new IllegalArgumentException("반려 사유를 입력해 주세요.");
        }
        PlatformApplication application = applicationRepository.getForUpdate(applicationId);
        application.reject(admin.getId(), memo.trim());
        actionLogger.log(null, admin.getId(), ActionTarget.PLATFORM_CHANGE, application.getId(), "REJECT_OPENING",
                "플랫폼 개설 반려: '" + application.getName() + "' — 사유: " + LogMemo.clip(memo.trim(), 200));
    }

    // 등록증 열람 — 운영자 또는 신청자 본인만.
    @Transactional(readOnly = true)
    public PlatformApplication getForCertificate(UUID applicationId, AuthenticatedUser actor) {
        PlatformApplication application = applicationRepository.getOrThrow(applicationId);
        if (actor.getRole() != Role.ADMIN && !application.getApplicantId().equals(actor.getId())) {
            throw new AccessDeniedException("이 등록증을 볼 권한이 없습니다.");
        }
        return application;
    }

    // 컨트롤러의 @PreAuthorize와 이중 검증 — 서비스가 다른 경로에서 호출돼도 운영자만 심사할 수 있게.
    private static void requireAdmin(AuthenticatedUser actor) {
        if (actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("운영자만 처리할 수 있습니다.");
        }
    }

    @Nullable
    private static String blankToNull(@Nullable String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
