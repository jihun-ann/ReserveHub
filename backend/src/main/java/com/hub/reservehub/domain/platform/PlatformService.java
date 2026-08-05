package com.hub.reservehub.domain.platform;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformService {

    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository platformStaffRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public PlatformService(
            PlatformRepository platformRepository,
            PlatformStaffRepository platformStaffRepository,
            PlatformAccessGuard platformAccessGuard
    ) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    // Creates a platform owned by the calling OWNER (role check happens at the controller via @PreAuthorize).
    // 호출한 OWNER 소유의 플랫폼을 생성한다 (역할 검증은 컨트롤러의 @PreAuthorize에서 수행).
    public Platform create(
            AuthenticatedUser owner, String name, BusinessType businessType,
            @Nullable String phone, @Nullable String address, @Nullable String description
    ) {
        return platformRepository.save(new Platform(name, businessType, phone, address, description, owner.getId()));
    }

    @Transactional(readOnly = true)
    public Platform get(UUID platformId, AuthenticatedUser user) {
        platformAccessGuard.verify(platformId, user);
        return platformRepository.findById(platformId)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found"));
    }

    @Transactional(readOnly = true)
    // Lists platforms the current user can see: owned platforms for OWNER, assigned platforms otherwise.
    // 현재 사용자가 볼 수 있는 플랫폼 목록: OWNER는 소유한 플랫폼, 그 외에는 배정된 플랫폼.
    public List<Platform> listAccessible(AuthenticatedUser user) {
        if (user.getRole() == Role.OWNER) {
            return platformRepository.findByCreatedBy(user.getId());
        }
        List<UUID> platformIds = platformStaffRepository.findByUserIdAndIsActiveTrue(user.getId()).stream()
                .map(PlatformStaff::getPlatformId)
                .toList();
        return platformRepository.findAllById(platformIds);
    }

    @Transactional
    // Assigns a staff member to a platform; enforces the MANAGER single-platform rule (AGENT.md 3, double-checked with the DB trigger).
    // 플랫폼에 스태프를 배정한다. MANAGER는 1개 플랫폼만 담당 가능한 규칙을 서비스 레이어에서도 검증한다 (DB 트리거와 이중 검증).
    public PlatformStaff assignStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId, StaffRole staffRole) {
        platformAccessGuard.verify(platformId, actor);

        if (staffRole == StaffRole.MANAGER
                && platformStaffRepository.existsByUserIdAndStaffRoleAndIsActiveTrue(targetUserId, StaffRole.MANAGER)) {
            throw new IllegalStateException("이미 다른 플랫폼의 MANAGER로 배정된 사용자입니다.");
        }

        return platformStaffRepository.save(new PlatformStaff(platformId, targetUserId, staffRole));
    }

    @Transactional
    public void removeStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId) {
        platformAccessGuard.verify(platformId, actor);

        PlatformStaff staff = platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Staff assignment not found"));
        staff.leave();
    }

    @Transactional(readOnly = true)
    public List<PlatformStaff> listStaff(UUID platformId, AuthenticatedUser user) {
        platformAccessGuard.verify(platformId, user);
        return platformStaffRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional
    // OWNER only; ownership is already enforced by the guard (non-owning users never pass the OWNER branch).
    // OWNER만 호출 가능하며, 소유권 검증은 가드에서 이미 처리된다 (OWNER 분기는 소유자만 통과).
    public Platform setSuspended(UUID platformId, AuthenticatedUser owner, boolean suspended) {
        platformAccessGuard.verify(platformId, owner);
        Platform platform = platformRepository.findById(platformId)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found"));
        if (suspended) {
            platform.suspend();
        } else {
            platform.activate();
        }
        return platform;
    }
}
