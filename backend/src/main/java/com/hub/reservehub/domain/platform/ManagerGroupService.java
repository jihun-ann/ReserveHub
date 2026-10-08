package com.hub.reservehub.domain.platform;

import java.util.stream.Collectors;
import java.util.Collection;
import java.util.HashSet;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 플랫폼별 매니저 그룹 관리 — 그룹 만들기/수정/삭제와 매니저를 그룹에 넣는 일. 오너 또는 MANAGER_MANAGE
 * 권한을 가진 매니저만 바꿀 수 있다. 매니저의 권한은 속한 그룹의 권한(ManagerPermission)이다.
 */
@Service
public class ManagerGroupService {

    private static final Set<ManagerPermission> ALL_MENUS = EnumSet.copyOf(
            Arrays.stream(ManagerPermission.values()).filter(p -> p.name().startsWith("MENU_")).toList());

    private final ManagerGroupRepository groupRepository;
    private final PlatformStaffRepository staffRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;
    private final UserService userService;

    public ManagerGroupService(
            ManagerGroupRepository groupRepository, PlatformStaffRepository staffRepository,
            PlatformAccessGuard platformAccessGuard, ActionLogRepository actionLogRepository,
            UserService userService
    ) {
        this.groupRepository = groupRepository;
        this.staffRepository = staffRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
        this.userService = userService;
    }

    // 플랫폼을 만들 때 기본 그룹 3개를 함께 만든다 (이름과 권한은 이후 자유롭게 바꿀 수 있다).
    @Transactional
    public void seedDefaults(UUID platformId) {
        groupRepository.save(new ManagerGroup(platformId, "일반", ALL_MENUS));

        Set<ManagerPermission> admin = EnumSet.copyOf(ALL_MENUS);
        admin.addAll(List.of(ManagerPermission.FACILITY_MANAGE, ManagerPermission.PROGRAM_MANAGE, ManagerPermission.TUTOR_MANAGE, ManagerPermission.JOIN_REQUEST_MANAGE));
        groupRepository.save(new ManagerGroup(platformId, "관리자", admin));

        groupRepository.save(new ManagerGroup(platformId, "임원", EnumSet.allOf(ManagerPermission.class)));
    }

    @Transactional(readOnly = true)
    public List<ManagerGroup> list(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verify(platformId, actor);
        return groupRepository.findByPlatformIdOrderByCreatedAtAsc(platformId);
    }

    // 현재 사용자가 이 플랫폼에서 가진 매니저 권한 — 프론트가 메뉴/버튼을 가릴 때 쓴다.
    @Transactional(readOnly = true)
    public Set<ManagerPermission> myPermissions(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verify(platformId, actor);
        return platformAccessGuard.permissionsOf(platformId, actor);
    }

    @Transactional
    public ManagerGroup create(UUID platformId, AuthenticatedUser actor, String name, Set<ManagerPermission> permissions) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MANAGER_MANAGE);
        String clean = cleanName(name);
        if (groupRepository.existsByPlatformIdAndName(platformId, clean)) {
            throw new IllegalStateException("같은 이름의 그룹이 이미 있습니다.");
        }
        ManagerGroup group = groupRepository.save(new ManagerGroup(platformId, clean, permissions));
        log(platformId, actor, group.getId(), "CREATE_MANAGER_GROUP", "매니저 그룹 생성: '" + clean + "' — 권한: " + labels(permissions));
        return group;
    }

    @Transactional
    public ManagerGroup update(UUID groupId, AuthenticatedUser actor, String name, Set<ManagerPermission> permissions) {
        ManagerGroup group = find(groupId);
        platformAccessGuard.verifyManagerPermission(group.getPlatformId(), actor, ManagerPermission.MANAGER_MANAGE);
        String clean = cleanName(name);
        if (!clean.equals(group.getName()) && groupRepository.existsByPlatformIdAndName(group.getPlatformId(), clean)) {
            throw new IllegalStateException("같은 이름의 그룹이 이미 있습니다.");
        }
        String oldName = group.getName();
        Set<ManagerPermission> added = new HashSet<>(permissions);
        added.removeAll(group.getPermissions());
        Set<ManagerPermission> removed = new HashSet<>(group.getPermissions());
        removed.removeAll(permissions);
        group.update(clean, permissions);
        log(group.getPlatformId(), actor, groupId, "UPDATE_MANAGER_GROUP", "매니저 그룹 수정: '" + oldName + "' — " + LogMemo.changes(
                LogMemo.change("이름", oldName, clean),
                added.isEmpty() ? null : "추가된 권한: " + labels(added),
                removed.isEmpty() ? null : "제거된 권한: " + labels(removed)
        ));
        return group;
    }

    @Transactional
    public void delete(UUID groupId, AuthenticatedUser actor) {
        ManagerGroup group = find(groupId);
        platformAccessGuard.verifyManagerPermission(group.getPlatformId(), actor, ManagerPermission.MANAGER_MANAGE);
        boolean inUse = staffRepository.findByPlatformId(group.getPlatformId()).stream()
                .anyMatch(s -> groupId.equals(s.getManagerGroupId()));
        if (inUse) {
            throw new IllegalStateException("소속 매니저가 있는 그룹은 삭제할 수 없습니다. 먼저 다른 그룹으로 옮기세요.");
        }
        groupRepository.delete(group);
        log(group.getPlatformId(), actor, groupId, "DELETE_MANAGER_GROUP", "매니저 그룹 삭제: '" + group.getName() + "'");
    }

    // 매니저를 그룹으로 옮긴다 — 그 그룹의 권한이 매니저에게 적용된다.
    @Transactional
    public PlatformStaff assign(UUID platformId, AuthenticatedUser actor, UUID targetUserId, UUID groupId) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MANAGER_MANAGE);
        ManagerGroup group = find(groupId);
        if (!group.getPlatformId().equals(platformId)) {
            throw new IllegalArgumentException("이 플랫폼의 그룹이 아닙니다.");
        }
        PlatformStaff staff = staffRepository.findByPlatformIdAndUserId(platformId, targetUserId).stream()
                .filter(s -> s.isActive() && s.getStaffRole() == StaffRole.MANAGER)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("이 사용자는 이 플랫폼의 매니저가 아닙니다."));
        String oldGroup = staff.getManagerGroupId() == null ? "없음"
                : groupRepository.findById(staff.getManagerGroupId()).map(ManagerGroup::getName).orElse("없음");
        staff.assignGroup(group);
        log(platformId, actor, staff.getId(), "CHANGE_MANAGER_GROUP",
                "매니저 그룹 변경: " + LogMemo.who(userService.get(targetUserId)) + " — '" + oldGroup + "' → '" + group.getName() + "'");
        return staff;
    }

    private static String labels(Collection<ManagerPermission> permissions) {
        return permissions.isEmpty() ? "없음" : permissions.stream().sorted().map(ManagerPermission::label).collect(Collectors.joining(", "));
    }

    private ManagerGroup find(UUID groupId) {
        return groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
    }

    private static String cleanName(String name) {
        String clean = name == null ? "" : name.trim();
        if (clean.isEmpty() || clean.length() > 50) {
            throw new IllegalArgumentException("그룹 이름은 1~50자여야 합니다.");
        }
        return clean;
    }

    private void log(UUID platformId, AuthenticatedUser actor, UUID targetId, String action, String detail) {
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.STAFF_CHANGE, targetId, action, detail));
    }
}
