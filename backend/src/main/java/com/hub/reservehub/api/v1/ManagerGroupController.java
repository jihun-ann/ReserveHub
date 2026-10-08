package com.hub.reservehub.api.v1;

import com.hub.reservehub.api.v1.PlatformController.PlatformStaffResponse;
import com.hub.reservehub.domain.platform.ManagerGroup;
import com.hub.reservehub.domain.platform.ManagerGroupService;
import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ManagerGroupController {

    private final ManagerGroupService groupService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public ManagerGroupController(ManagerGroupService groupService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.groupService = groupService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @GetMapping("/api/v1/platforms/{platformId}/manager-groups")
    public List<GroupResponse> list(@PathVariable UUID platformId) {
        return groupService.list(platformId, currentAuthenticatedUser.get()).stream().map(GroupResponse::from).toList();
    }

    // 현재 사용자의 이 플랫폼 매니저 권한 — 오너는 전부. 프론트가 메뉴/버튼을 가리는 데 쓴다.
    @GetMapping("/api/v1/platforms/{platformId}/my-permissions")
    public Set<ManagerPermission> myPermissions(@PathVariable UUID platformId) {
        return groupService.myPermissions(platformId, currentAuthenticatedUser.get());
    }

    @PostMapping("/api/v1/platforms/{platformId}/manager-groups")
    public ResponseEntity<GroupResponse> create(@PathVariable UUID platformId, @Valid @RequestBody GroupRequest request) {
        ManagerGroup group = groupService.create(platformId, currentAuthenticatedUser.get(), request.name(), request.permissions());
        return ResponseEntity.status(HttpStatus.CREATED).body(GroupResponse.from(group));
    }

    @PatchMapping("/api/v1/manager-groups/{id}")
    public GroupResponse update(@PathVariable UUID id, @Valid @RequestBody GroupRequest request) {
        return GroupResponse.from(groupService.update(id, currentAuthenticatedUser.get(), request.name(), request.permissions()));
    }

    @DeleteMapping("/api/v1/manager-groups/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        groupService.delete(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    // 매니저를 그룹으로 옮긴다 — 그룹의 권한이 그 매니저에게 적용된다.
    @PatchMapping("/api/v1/platforms/{platformId}/staff/{userId}/manager-group")
    public PlatformStaffResponse assign(@PathVariable UUID platformId, @PathVariable UUID userId, @Valid @RequestBody AssignRequest request) {
        return PlatformStaffResponse.from(groupService.assign(platformId, currentAuthenticatedUser.get(), userId, request.groupId()));
    }

    public record GroupRequest(@NotBlank @Size(max = 50) String name, @NotNull Set<ManagerPermission> permissions) {
    }

    public record AssignRequest(@NotNull UUID groupId) {
    }

    public record GroupResponse(UUID id, UUID platformId, String name, Set<ManagerPermission> permissions) {
        static GroupResponse from(ManagerGroup g) {
            return new GroupResponse(g.getId(), g.getPlatformId(), g.getName(), g.getPermissions());
        }
    }
}
