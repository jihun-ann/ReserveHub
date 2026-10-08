package com.hub.reservehub.domain.platform;

import java.security.SecureRandom;
import java.util.stream.Collectors;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.domain.approval.LogMemo;
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
    private final ManagerGroupService managerGroupService;
    private final UserService userService;

    public PlatformService(
            PlatformRepository platformRepository,
            PlatformStaffRepository platformStaffRepository,
            PlatformTaxAccountantRepository platformTaxAccountantRepository,
            UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository,
            ManagerGroupService managerGroupService,
            UserService userService
    ) {
        this.platformRepository = platformRepository;
        this.platformStaffRepository = platformStaffRepository;
        this.platformTaxAccountantRepository = platformTaxAccountantRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
        this.managerGroupService = managerGroupService;
        this.userService = userService;
    }

    private static final String CODE_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom CODE_RANDOM = new SecureRandom();

    // 공개 ID: 0-9, A-Z 6자리(36^6 ≈ 21억 가지). 겹치면 다시 뽑는다 — DB 유니크 제약이 최종 방어선이다.
    private String newPlatformCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(CODE_RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (platformRepository.existsByCode(code));
        return code;
    }

    @Transactional
    // Creates a platform owned by the calling OWNER (role check happens at the controller via @PreAuthorize).
    // 호출한 OWNER 소유의 플랫폼을 생성한다 (역할 검증은 컨트롤러의 @PreAuthorize에서 수행).
    public Platform create(
            AuthenticatedUser owner, String name, BusinessType businessType,
            @Nullable String phone, @Nullable String address, @Nullable String description
    ) {
        Platform platform = platformRepository.save(new Platform(newPlatformCode(), name, businessType, phone, address, description, owner.getId()));
        managerGroupService.seedDefaults(platform.getId());
        return platform;
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
    // 등급 게이트: TUTOR 배정은 MEDIUM 이상, MANAGER 배정(관리자 지정)은 HIGH만 가능 — "관리자 설정 변경" 권한.
    public PlatformStaff assignStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId, StaffRole staffRole) {
        return assignStaff(platformId, actor, targetUserId, staffRole, null);
    }

    @Transactional
    public PlatformStaff assignStaff(
            UUID platformId, AuthenticatedUser actor, UUID targetUserId, StaffRole staffRole, @Nullable ManagerTier initialManagerTier
    ) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, staffRole == StaffRole.MANAGER ? ManagerPermission.MANAGER_MANAGE : ManagerPermission.TUTOR_MANAGE);
        return createAssignment(platformId, actor.getId(), targetUserId, staffRole, initialManagerTier);
    }

    // 등급 검증은 호출자 몫 — 초대 수락처럼 "배정하는 사람"이 이미 초대 시점에 검증된 경우에 쓴다.
    // StaffInvitationService와 같은 패키지에서만 호출한다.
    PlatformStaff createAssignment(
            UUID platformId, UUID actorId, UUID targetUserId, StaffRole staffRole, @Nullable ManagerTier initialManagerTier
    ) {
        if (platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .anyMatch(s -> s.isActive() && s.getStaffRole() == staffRole)) {
            throw new IllegalStateException("이미 이 플랫폼에 배정된 역할입니다.");
        }
        if (staffRole == StaffRole.MANAGER
                && platformStaffRepository.existsByUserIdAndStaffRoleAndIsActiveTrue(targetUserId, StaffRole.MANAGER)) {
            throw new IllegalStateException("이미 다른 플랫폼의 MANAGER로 배정된 사용자입니다.");
        }

        PlatformStaff staff = platformStaffRepository.save(
                staffRole == StaffRole.MANAGER
                        ? new PlatformStaff(platformId, targetUserId, staffRole, initialManagerTier != null ? initialManagerTier : ManagerTier.LOW)
                        : new PlatformStaff(platformId, targetUserId, staffRole)
        );
        actionLogRepository.save(ActionLog.of(
                platformId, actorId, ActionTarget.STAFF_CHANGE, staff.getId(), "ASSIGN_" + staffRole.name(),
                "직원 배정: " + LogMemo.who(userService.get(targetUserId)) + " → " + (staffRole == StaffRole.MANAGER ? "매니저" : "강사")
        ));
        return staff;
    }

    @Transactional
    // Removes the target from the platform entirely — if they hold more than one active StaffRole
    // there (e.g. MANAGER+TUTOR), all of them end at once, matching the single "제거" action in the UI.
    // 대상을 플랫폼에서 완전히 제거한다 — 여러 StaffRole(예: MANAGER+TUTOR)을 동시에 갖고 있어도
    // UI의 단일 "제거" 동작에 맞춰 한 번에 모두 해제한다. 등급 게이트는 배정과 대칭: 대상이 MANAGER를
    // 하나라도 갖고 있으면 HIGH, TUTOR뿐이면 MEDIUM 이상이 필요하다.
    public void removeStaff(UUID platformId, AuthenticatedUser actor, UUID targetUserId) {
        List<PlatformStaff> staffList = platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .filter(PlatformStaff::isActive)
                .toList();
        if (staffList.isEmpty()) {
            throw new IllegalArgumentException("Staff assignment not found");
        }
        boolean removesManager = staffList.stream().anyMatch(s -> s.getStaffRole() == StaffRole.MANAGER);
        platformAccessGuard.verifyManagerPermission(platformId, actor, removesManager ? ManagerPermission.MANAGER_MANAGE : ManagerPermission.TUTOR_MANAGE);

        staffList.forEach(PlatformStaff::leave);
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.STAFF_CHANGE, targetUserId, "REMOVE",
                "직원 삭제: " + LogMemo.who(userService.get(targetUserId)) + " (해제된 역할: "
                        + staffList.stream().map(st -> st.getStaffRole() == StaffRole.MANAGER ? "매니저" : "강사").distinct().collect(Collectors.joining(", ")) + ")"));
    }

    @Transactional(readOnly = true)
    public List<PlatformStaff> listStaff(UUID platformId, AuthenticatedUser user, boolean includeInactive) {
        platformAccessGuard.verify(platformId, user);
        return includeInactive
                ? platformStaffRepository.findByPlatformId(platformId)
                : platformStaffRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional
    // 소득유형(근로/사업/기타/일용) 지정 — 원천징수 계산에 쓰인다. MANAGER 이상만 변경 가능.
    // 한 사람이 이 플랫폼에서 여러 StaffRole(예: MANAGER+TUTOR)을 동시에 가질 수 있으므로 활성 배정
    // 전부에 동일하게 적용한다 — 소득유형은 역할이 아니라 사람에 딸린 정보이기 때문.
    public List<PlatformStaff> updateStaffIncomeType(UUID platformId, AuthenticatedUser actor, UUID targetUserId, IncomeType incomeType) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        List<PlatformStaff> staffList = platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .filter(PlatformStaff::isActive)
                .toList();
        if (staffList.isEmpty()) {
            throw new IllegalArgumentException("Staff assignment not found");
        }
        IncomeType before = staffList.get(0).getIncomeType();
        staffList.forEach(staff -> staff.changeIncomeType(incomeType));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.STAFF_CHANGE, targetUserId, "UPDATE_INCOME_TYPE",
                "소득유형 변경: " + LogMemo.who(userService.get(targetUserId)) + " — " + LogMemo.changes(LogMemo.change("소득유형", before, incomeType))));
        return staffList;
    }

    @Transactional
    // 회당 강사료 지정 — TUTOR 역할에만 의미가 있으므로 그 역할의 배정에만 적용한다(겸직이어도
    // MANAGER 몫 급여는 건드리지 않음). MANAGER 이상만 변경 가능.
    public PlatformStaff updateStaffSessionRate(UUID platformId, AuthenticatedUser actor, UUID targetUserId, int sessionRate) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        PlatformStaff staff = platformStaffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .filter(s -> s.isActive() && s.getStaffRole() == StaffRole.TUTOR)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("이 사용자는 이 플랫폼의 강사가 아닙니다."));
        Integer before = staff.getSessionRate();
        staff.changeSessionRate(sessionRate);
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.STAFF_CHANGE, targetUserId, "UPDATE_SESSION_RATE",
                "강사료 변경: " + LogMemo.who(userService.get(targetUserId)) + " — 회당 "
                        + (before == null ? "미설정" : LogMemo.won(before)) + " → " + LogMemo.won(sessionRate)));
        return staff;
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
                platformId, owner.getId(), ActionTarget.PLATFORM_CHANGE, platformId, suspended ? "SUSPEND" : "ACTIVATE",
                (suspended ? "플랫폼 운영 정지: '" : "플랫폼 정지 해제: '") + platform.getName() + "'"
        ));
        return platform;
    }
}
