package com.hub.reservehub.domain.platform;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformService {

    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository platformStaffRepository;
    private final PlatformTaxAccountantRepository platformTaxAccountantRepository;
    private final UserPassRepository userPassRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public PlatformService(
            PlatformRepository platformRepository,
            PlatformStaffRepository platformStaffRepository,
            PlatformTaxAccountantRepository platformTaxAccountantRepository,
            UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository
    ) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
        this.platformTaxAccountantRepository = platformTaxAccountantRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
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
    // Lists every platform the user has ANY standing on — owns it, staffs it, or holds a pass there —
    // since one account can hold different standings on different platforms at once.
    // 소유·스태프·수강권 보유 중 하나라도 해당되는 모든 플랫폼을 반환한다 — 한 계정이 플랫폼마다
    // 서로 다른 자격을 동시에 가질 수 있기 때문이다.
    public List<Platform> listAccessible(AuthenticatedUser user) {
        Set<UUID> platformIds = new LinkedHashSet<>();
        platformRepository.findByCreatedBy(user.getId()).forEach(p -> platformIds.add(p.getId()));
        platformStaffRepository.findByUserIdAndIsActiveTrue(user.getId())
                .forEach(staff -> platformIds.add(staff.getPlatformId()));
        userPassRepository.findByUserId(user.getId())
                .forEach(userPass -> platformIds.add(userPass.getPlatformId()));
        platformTaxAccountantRepository.findByUserIdAndIsActiveTrue(user.getId())
                .forEach(grant -> platformIds.add(grant.getPlatformId()));
        return platformRepository.findAllById(platformIds);
    }

    @Transactional(readOnly = true)
    // The account's standings on THIS specific platform — may hold more than one at once
    // (e.g. staffing a platform as both MANAGER and TUTOR, or staffing it while also having
    // bought a pass there as a customer).
    // 이 플랫폼에서 계정이 가진 자격들 — 한 플랫폼에서 MANAGER와 TUTOR을 동시에 갖거나, 스태프이면서
    // 동시에 수강권을 산 고객일 수도 있어 둘 이상일 수 있다.
    public List<String> myRoles(UUID platformId, AuthenticatedUser user) {
        List<String> roles = new ArrayList<>();
        if (platformRepository.existsByIdAndCreatedBy(platformId, user.getId())) {
            roles.add("OWNER");
        }
        platformStaffRepository.findByPlatformIdAndUserId(platformId, user.getId()).stream()
                .filter(PlatformStaff::isActive)
                .forEach(staff -> roles.add(staff.getStaffRole().name()));
        boolean hasPass = userPassRepository.findByUserId(user.getId()).stream()
                .anyMatch(userPass -> userPass.getPlatformId().equals(platformId));
        if (hasPass) {
            roles.add("USER");
        }
        if (platformTaxAccountantRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, user.getId())) {
            roles.add("TAX_ACCOUNTANT");
        }
        return roles;
    }

    @Transactional
    // Assigns a staff member to a platform; enforces the MANAGER single-platform rule (AGENT.md 3, double-checked with the DB trigger).
    // 플랫폼에 스태프를 배정한다. MANAGER는 1개 플랫폼만 담당 가능한 규칙을 서비스 레이어에서도 검증한다 (DB 트리거와 이중 검증).
    public PlatformStaff assignStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId, StaffRole staffRole) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);

        if (staffRole == StaffRole.MANAGER
                && platformStaffRepository.existsByUserIdAndStaffRoleAndIsActiveTrue(targetUserId, StaffRole.MANAGER)) {
            throw new IllegalStateException("이미 다른 플랫폼의 MANAGER로 배정된 사용자입니다.");
        }

        PlatformStaff staff = platformStaffRepository.save(new PlatformStaff(platformId, targetUserId, staffRole));
        actionLogRepository.save(ActionLog.of(
                platformId, actor.getId(), ActionTarget.STAFF_CHANGE, staff.getId(), "ASSIGN_" + staffRole.name(), null
        ));
        return staff;
    }

    @Transactional
    // Removes the target from the platform entirely — if they hold more than one active StaffRole
    // there (e.g. MANAGER+TUTOR), all of them end at once, matching the single "제거" action in the UI.
    // 대상을 플랫폼에서 완전히 제거한다 — 여러 StaffRole(예: MANAGER+TUTOR)을 동시에 갖고 있어도
    // UI의 단일 "제거" 동작에 맞춰 한 번에 모두 해제한다.
    public void removeStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);

        List<PlatformStaff> staffList = platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .filter(PlatformStaff::isActive)
                .toList();
        if (staffList.isEmpty()) {
            throw new IllegalArgumentException("Staff assignment not found");
        }
        staffList.forEach(PlatformStaff::leave);
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.STAFF_CHANGE, targetUserId, "REMOVE", null));
    }

    @Transactional(readOnly = true)
    public List<PlatformStaff> listStaff(UUID platformId, AuthenticatedUser user, boolean includeInactive) {
        platformAccessGuard.verify(platformId, user);
        return includeInactive
                ? platformStaffRepository.findByPlatformId(platformId)
                : platformStaffRepository.findByPlatformIdAndIsActiveTrue(platformId);
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
        actionLogRepository.save(ActionLog.of(
                platformId, owner.getId(), ActionTarget.PLATFORM_CHANGE, platformId, suspended ? "SUSPEND" : "ACTIVATE", null
        ));
        return platform;
    }
}
