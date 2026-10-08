package com.hub.reservehub.domain.platform;

import org.springframework.beans.factory.annotation.Value;
import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 강사/매니저 초대 흐름 — 초대 생성(링크 발급) → 초대받은 사람이 링크로 로그인 → 계정의 이메일/연락처가
 * 초대와 일치하면 수락 → PlatformStaff 배정. 메일/SMS 발송은 없고, 링크 전달은 초대한 사람이 직접 한다.
 */
@Service
public class StaffInvitationService {

    private static final Duration VALID_FOR = Duration.ofDays(7);

    private final StaffInvitationRepository invitationRepository;
    private final PlatformRepository platformRepository;
    private final PlatformService platformService;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;
    private final UserService userService;
    private final boolean requireVerifiedContact;

    public StaffInvitationService(
            StaffInvitationRepository invitationRepository, PlatformRepository platformRepository,
            PlatformService platformService, PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository, UserService userService,
            @Value("${app.invitation.require-verified-contact:false}") boolean requireVerifiedContact
    ) {
        this.invitationRepository = invitationRepository;
        this.platformRepository = platformRepository;
        this.platformService = platformService;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
        this.userService = userService;
        this.requireVerifiedContact = requireVerifiedContact;
    }

    // 초대 권한은 직접 배정과 같다 — 매니저 초대는 HIGH 등급/오너, 강사 초대는 MEDIUM 이상.
    private void verifyCanManage(UUID platformId, AuthenticatedUser actor, StaffRole role) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, role == StaffRole.MANAGER ? ManagerPermission.MANAGER_MANAGE : ManagerPermission.TUTOR_MANAGE);
    }

    @Transactional
    public StaffInvitation create(
            UUID platformId, AuthenticatedUser actor, StaffRole role, @Nullable ManagerTier tier,
            @Nullable String email, @Nullable String phone
    ) {
        verifyCanManage(platformId, actor, role);
        String normEmail = email == null || email.isBlank() ? null : email.trim();
        String normPhone = normalizePhone(phone);
        if (normEmail == null && normPhone == null) {
            throw new IllegalArgumentException("이메일 또는 연락처 중 하나는 필요합니다.");
        }
        StaffInvitation invitation = invitationRepository.save(new StaffInvitation(
                platformId, role, role == StaffRole.MANAGER ? (tier != null ? tier : ManagerTier.LOW) : null,
                normEmail, normPhone, actor.getId(), Instant.now().plus(VALID_FOR)
        ));
        actionLogRepository.save(ActionLog.of(
                platformId, actor.getId(), ActionTarget.STAFF_CHANGE, invitation.getId(), "INVITE_" + role.name(),
                "직원 초대: " + roleLabel(role) + " — " + contact(normEmail, normPhone) + " (유효 " + VALID_FOR.toDays() + "일)"
        ));
        return invitation;
    }

    @Transactional(readOnly = true)
    public List<StaffInvitation> listPending(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.TUTOR_MANAGE, ManagerPermission.MANAGER_MANAGE);
        return invitationRepository.findByPlatformIdAndStatusOrderByCreatedAtDesc(platformId, InvitationStatus.PENDING)
                .stream().filter(i -> !i.isExpired()).toList();
    }

    @Transactional
    public void cancel(UUID invitationId, AuthenticatedUser actor) {
        StaffInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
        verifyCanManage(invitation.getPlatformId(), actor, invitation.getStaffRole());
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("대기 중인 초대만 취소할 수 있습니다.");
        }
        invitation.cancel();
        actionLogRepository.save(ActionLog.of(
                invitation.getPlatformId(), actor.getId(), ActionTarget.STAFF_CHANGE, invitation.getId(), "INVITE_CANCEL",
                "초대 취소: " + roleLabel(invitation.getStaffRole()) + " — " + contact(invitation.getEmail(), invitation.getPhone())
        ));
    }

    // 링크를 연 사람에게 "어느 플랫폼의 어떤 역할 초대인지" 보여주기 위한 조회 — 로그인 전에도 호출된다.
    @Transactional(readOnly = true)
    public Preview preview(String token) {
        StaffInvitation invitation = findByToken(token);
        String platformName = platformRepository.findById(invitation.getPlatformId()).map(Platform::getName).orElse("");
        return new Preview(invitation, platformName);
    }

    public record Preview(StaffInvitation invitation, String platformName) {
    }

    @Transactional
    public PlatformStaff accept(String token, AuthenticatedUser actor) {
        StaffInvitation invitation = findByToken(token);
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 초대입니다.");
        }
        if (invitation.isExpired()) {
            throw new IllegalStateException("만료된 초대입니다. 초대한 분께 다시 요청하세요.");
        }
        User user = userService.get(actor.getId());
        // 인증을 요구하는 설정이면, 초대와 일치하더라도 그 이메일/연락처가 인증된 계정만 수락할 수 있다.
        boolean emailMatches = invitation.getEmail() != null && invitation.getEmail().equalsIgnoreCase(user.getEmail())
                && (!requireVerifiedContact || user.getEmailVerifiedAt() != null);
        boolean phoneMatches = invitation.getPhone() != null && invitation.getPhone().equals(normalizePhone(user.getPhone()))
                && (!requireVerifiedContact || user.getPhoneVerifiedAt() != null);
        if (!emailMatches && !phoneMatches) {
            throw new IllegalArgumentException(requireVerifiedContact
                    ? "초대받은 이메일/연락처와 일치하는 인증된 계정이 아닙니다. 내 정보에서 이메일/연락처 인증을 완료해 주세요."
                    : "초대받은 이메일/연락처와 로그인한 계정 정보가 일치하지 않습니다.");
        }
        PlatformStaff staff = platformService.createAssignment(
                invitation.getPlatformId(), invitation.getCreatedBy(), user.getId(),
                invitation.getStaffRole(), invitation.getManagerTier()
        );
        invitation.accept();
        actionLogRepository.save(ActionLog.of(
                invitation.getPlatformId(), actor.getId(), ActionTarget.STAFF_CHANGE, invitation.getId(), "INVITE_ACCEPT",
                "초대 수락: " + LogMemo.who(user) + " → " + roleLabel(invitation.getStaffRole()) + " 배정"
        ));
        return staff;
    }

    private static String roleLabel(StaffRole role) {
        return role == StaffRole.MANAGER ? "매니저" : "강사";
    }

    // 초대 대상 표시 — 이메일/연락처 중 적힌 것만.
    private static String contact(@Nullable String email, @Nullable String phone) {
        return java.util.stream.Stream.of(email, phone).filter(v -> v != null && !v.isBlank()).collect(java.util.stream.Collectors.joining(" / "));
    }

    private StaffInvitation findByToken(String token) {
        return invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대 링크입니다."));
    }

    @Nullable
    private static String normalizePhone(@Nullable String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }
}
