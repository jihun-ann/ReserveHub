package com.hub.reservehub.domain.user;

import org.springframework.security.access.AccessDeniedException;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.platform.JoinRequest;
import com.hub.reservehub.domain.platform.JoinRequestRepository;
import com.hub.reservehub.domain.platform.JoinRequestStatus;
import com.hub.reservehub.domain.platform.PlatformRepository;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import com.hub.reservehub.domain.platform.PlatformStatus;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 계정 탈퇴 — 계정을 삭제하지 않고 비활성화한다. 주문/수강권/활동 이력이 이 계정을 참조하므로 행은 남기고
 * 로그인만 막는다. 아이디(username)는 계속 점유되어 다시 쓸 수 없고, 이메일은 활성 계정끼리만 유일하다.
 */
@Service
public class AccountService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository staffRepository;
    private final JoinRequestRepository joinRequestRepository;

    public AccountService(
            UserService userService, PasswordEncoder passwordEncoder, PlatformRepository platformRepository,
            PlatformStaffRepository staffRepository, JoinRequestRepository joinRequestRepository
    ) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.platformRepository = platformRepository;
        this.staffRepository = staffRepository;
        this.joinRequestRepository = joinRequestRepository;
    }

    // 다른 사람 대신 계정을 만들어 주는 기능(현장 회원 등록 등)은 플랫폼 운영진만 쓸 수 있고, 만들 수 있는 역할은
    // 회원(USER)과 강사(TUTOR)뿐이다. 대표/매니저/세무사 계정은 이 경로로 만들 수 없다.
    @Transactional(readOnly = true)
    public void verifyCanProvisionAccount(UUID actorId, Role role) {
        if (role != Role.USER && role != Role.TUTOR) {
            throw new AccessDeniedException("이 역할의 계정은 직접 만들 수 없습니다.");
        }
        boolean isOwner = !platformRepository.findByCreatedBy(actorId).isEmpty();
        boolean isManager = staffRepository.findByUserIdAndIsActiveTrue(actorId).stream()
                .anyMatch(s -> s.getStaffRole() == StaffRole.MANAGER);
        if (!isOwner && !isManager) {
            throw new AccessDeniedException("계정을 만들 권한이 없습니다.");
        }
    }

    @Transactional
    public void deactivate(UUID userId, String rawPassword) {
        User user = userService.get(userId);
        if (rawPassword == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }
        if (platformRepository.findByCreatedBy(userId).stream().anyMatch(p -> p.getStatus() != PlatformStatus.INACTIVE)) {
            throw new IllegalStateException("운영 중인 플랫폼이 있어 탈퇴할 수 없습니다. 먼저 플랫폼 운영을 종료해 주세요.");
        }
        if (!staffRepository.findByUserIdAndIsActiveTrue(userId).isEmpty()) {
            throw new IllegalStateException("강사/매니저로 소속된 플랫폼이 있어 탈퇴할 수 없습니다. 먼저 소속에서 빠져 주세요.");
        }
        // 대기 중인 가입 신청은 센터에 남지 않도록 취소한다.
        joinRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> r.getStatus() == JoinRequestStatus.PENDING)
                .forEach(JoinRequest::cancel);
        user.deactivate();
    }
}
