package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Verifies that the current user may act on a given platform before any platform-scoped query.
 * 플랫폼 범위 조회/처리 전에 현재 사용자가 해당 플랫폼에 접근 가능한지 검증한다 (AGENT.md 4-1).
 *
 * A person's per-platform standing is determined by actual ownership/staff records, never by the
 * account's global role — the same account can own one platform, manage another, and just be a
 * paying customer of a third.
 * 계정의 전역 role이 아니라 실제 소유/스태프 배정 기록으로 플랫폼별 권한을 판단한다 — 같은 계정이
 * 플랫폼 A는 소유하고, B는 매니저로 관리하고, C에서는 그냥 수강생일 수 있다.
 */
@Component
public class PlatformAccessGuard {

    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository platformStaffRepository;

    public PlatformAccessGuard(PlatformRepository platformRepository, PlatformStaffRepository platformStaffRepository) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
    }

    // Owner of the platform OR an active staff member (any role) may access it.
    // 플랫폼 소유자 또는 활성 스태프(역할 무관)면 접근할 수 있다.
    public void verify(UUID platformId, AuthenticatedUser user) {
        boolean allowed = platformRepository.existsByIdAndCreatedBy(platformId, user.getId())
                || platformStaffRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, user.getId());

        if (!allowed) {
            throw new PlatformAccessDeniedException(platformId);
        }
    }

    // Owner always passes; otherwise at least one of the actor's active PlatformStaff.staffRole
    // entries on THIS platform must be in allowedRoles — a user may hold more than one role here
    // (e.g. MANAGER+TUTOR) — never their global account role.
    // 소유자는 항상 통과하고, 그 외에는 이 플랫폼에서의 실제 활성 스태프 역할 중 하나라도 allowedRoles에
    // 포함되어야 한다 (한 사용자가 이 플랫폼에서 MANAGER+TUTOR처럼 여러 role을 가질 수 있다. 계정의 전역 role은 아님).
    public void verifyRole(UUID platformId, AuthenticatedUser user, StaffRole... allowedRoles) {
        if (platformRepository.existsByIdAndCreatedBy(platformId, user.getId())) {
            return;
        }
        List<StaffRole> allowed = Arrays.asList(allowedRoles);
        boolean hasRole = platformStaffRepository.findByPlatformIdAndUserId(platformId, user.getId()).stream()
                .anyMatch(staff -> staff.isActive() && allowed.contains(staff.getStaffRole()));
        if (!hasRole) {
            throw new PlatformAccessDeniedException(platformId);
        }
    }
}
