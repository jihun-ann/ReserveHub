package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Verifies that the current user may act on a given platform before any platform-scoped query.
 * 플랫폼 범위 조회/처리 전에 현재 사용자가 해당 플랫폼에 접근 가능한지 검증한다 (AGENT.md 4-1).
 */
@Component
public class PlatformAccessGuard {

    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository platformStaffRepository;

    public PlatformAccessGuard(PlatformRepository platformRepository, PlatformStaffRepository platformStaffRepository) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
    }

    // OWNER may access platforms they created; MANAGER/ADMIN(tutor) must hold an active staff assignment.
    // OWNER는 자신이 생성한 플랫폼에, MANAGER/ADMIN(강사)은 활성 스태프로 배정된 플랫폼에만 접근할 수 있다.
    public void verify(UUID platformId, AuthenticatedUser user) {
        boolean allowed = user.getRole() == Role.OWNER
                ? platformRepository.existsByIdAndCreatedBy(platformId, user.getId())
                : platformStaffRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, user.getId());

        if (!allowed) {
            throw new PlatformAccessDeniedException(platformId);
        }
    }
}
