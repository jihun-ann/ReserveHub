package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.domain.platform.PlatformApplication;
import com.hub.reservehub.domain.platform.PlatformApplicationService;
import com.hub.reservehub.domain.platform.PlatformApplicationService.ApplicationInput;
import com.hub.reservehub.domain.platform.PlatformApplicationService.WithApplicant;
import com.hub.reservehub.domain.platform.PlatformApplicationStatus;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// 플랫폼 개설 신청(신청자용)과 심사(운영자용, /api/v1/admin/**) 엔드포인트.
@RestController
public class PlatformApplicationController {

    private final PlatformApplicationService applicationService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public PlatformApplicationController(PlatformApplicationService applicationService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.applicationService = applicationService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platform-applications")
    // Submits an opening application (multipart: fields + certificate file). The platform is created only on ADMIN approval.
    // 개설 신청(멀티파트: 입력값 + 사업자등록증 파일). 플랫폼은 운영자가 승인할 때 만들어진다.
    public ResponseEntity<ApplicationResponse> submit(
            @RequestParam String name,
            @RequestParam BusinessType businessType,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String description,
            @RequestParam String businessNumber,
            @RequestParam(required = false) MultipartFile certificate
    ) {
        PlatformApplication created = applicationService.submit(
                currentAuthenticatedUser.get(),
                new ApplicationInput(name, businessType, phone, address, description, businessNumber),
                certificate
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApplicationResponse.from(created));
    }

    @GetMapping("/api/v1/platform-applications/mine")
    public List<ApplicationResponse> mine() {
        return applicationService.listMine(currentAuthenticatedUser.get()).stream().map(ApplicationResponse::from).toList();
    }

    @PostMapping("/api/v1/platform-applications/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        applicationService.cancel(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/platform-applications/{id}/certificate")
    public ResponseEntity<Resource> certificate(@PathVariable UUID id) throws IOException {
        PlatformApplication application = applicationService.getForCertificate(id, currentAuthenticatedUser.get());
        Resource resource = new FileSystemResource(application.getCertificateStoredPath());
        return ResponseEntity.ok()
                // 업로드 때 PDF/PNG/JPG만 받았지만, 응답도 같은 허용 목록으로 한 번 더 거른다.
                .contentType(WorkRequestCommentController.safeContentType(application.getCertificateContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(application.getCertificateOriginalName(), StandardCharsets.UTF_8).build().toString())
                .contentLength(Files.size(resource.getFile().toPath()))
                .body(resource);
    }

    @GetMapping("/api/v1/admin/platform-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminApplicationResponse> listForAdmin(@RequestParam(defaultValue = "PENDING") PlatformApplicationStatus status) {
        return applicationService.listByStatus(currentAuthenticatedUser.get(), status).stream()
                .map(AdminApplicationResponse::from).toList();
    }

    @PostMapping("/api/v1/admin/platform-applications/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApproveResponse approve(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        Platform platform = applicationService.approve(id, currentAuthenticatedUser.get(), request == null ? null : request.memo());
        return new ApproveResponse(platform.getId(), platform.getCode());
    }

    @PostMapping("/api/v1/admin/platform-applications/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reject(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        applicationService.reject(id, currentAuthenticatedUser.get(), request == null ? null : request.memo());
        return ResponseEntity.noContent().build();
    }

    public record DecisionRequest(@Nullable String memo) {
    }

    public record ApproveResponse(UUID platformId, String platformCode) {
    }

    public record ApplicationResponse(
            UUID id, String name, BusinessType businessType, @Nullable String phone, @Nullable String address,
            @Nullable String description, String businessNumber, String certificateName, PlatformApplicationStatus status,
            @Nullable String decisionMemo, @Nullable UUID platformId, Instant createdAt, @Nullable Instant decidedAt
    ) {
        static ApplicationResponse from(PlatformApplication a) {
            return new ApplicationResponse(a.getId(), a.getName(), a.getBusinessType(), a.getPhone(), a.getAddress(),
                    a.getDescription(), a.getBusinessNumber(), a.getCertificateOriginalName(), a.getStatus(),
                    a.getDecisionMemo(), a.getPlatformId(), a.getCreatedAt(), a.getDecidedAt());
        }
    }

    public record AdminApplicationResponse(
            ApplicationResponse application, @Nullable String applicantName, @Nullable String applicantUsername,
            @Nullable String applicantEmail, @Nullable String applicantPhone
    ) {
        static AdminApplicationResponse from(WithApplicant w) {
            var u = w.applicant();
            return new AdminApplicationResponse(ApplicationResponse.from(w.application()),
                    u == null ? null : u.getName(), u == null ? null : u.getUsername(),
                    u == null ? null : u.getEmail(), u == null ? null : u.getPhone());
        }
    }
}
