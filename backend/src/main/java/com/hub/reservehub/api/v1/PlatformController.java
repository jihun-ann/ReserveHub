package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.domain.platform.PlatformService;
import com.hub.reservehub.domain.platform.PlatformStaff;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/platforms")
public class PlatformController {

    private final PlatformService platformService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public PlatformController(PlatformService platformService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.platformService = platformService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    // Creates a platform; only OWNER may create one (AGENT.md 3: 플랫폼 생성은 OWNER만 가능).
    // 플랫폼을 생성한다. 플랫폼 생성은 OWNER만 가능하다.
    public ResponseEntity<PlatformResponse> createPlatform(@Valid @RequestBody CreatePlatformRequest request) {
        Platform platform = platformService.create(
                currentAuthenticatedUser.get(), request.name(), request.businessType(),
                request.phone(), request.address(), request.description()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PlatformResponse.from(platform));
    }

    @GetMapping("/{id}")
    public PlatformResponse getPlatform(@PathVariable UUID id) {
        return PlatformResponse.from(platformService.get(id, currentAuthenticatedUser.get()));
    }

    @GetMapping
    // Lists platforms visible to the caller: owned platforms for OWNER, assigned platforms otherwise.
    // 호출자가 볼 수 있는 플랫폼 목록: OWNER는 소유한 플랫폼, 그 외는 배정된 플랫폼.
    public List<PlatformResponse> listPlatforms() {
        return platformService.listAccessible(currentAuthenticatedUser.get()).stream()
                .map(PlatformResponse::from)
                .toList();
    }

    @PostMapping("/{id}/staff")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    // Assigns a staff member to the platform; caller must already have access to it (checked in the service).
    // 플랫폼에 스태프를 배정한다. 호출자는 해당 플랫폼에 접근 권한이 있어야 한다 (서비스에서 검증).
    public ResponseEntity<PlatformStaffResponse> assignStaff(
            @PathVariable UUID id, @Valid @RequestBody AssignStaffRequest request
    ) {
        PlatformStaff staff = platformService.assignStaff(
                id, currentAuthenticatedUser.get(), request.userId(), request.staffRole()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PlatformStaffResponse.from(staff));
    }

    @DeleteMapping("/{id}/staff/{userId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Void> removeStaff(@PathVariable UUID id, @PathVariable UUID userId) {
        platformService.removeStaff(id, currentAuthenticatedUser.get(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/staff")
    public List<PlatformStaffResponse> listStaff(@PathVariable UUID id) {
        return platformService.listStaff(id, currentAuthenticatedUser.get()).stream()
                .map(PlatformStaffResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    // Suspends or reactivates a platform; only the owning OWNER may do this (guard checks ownership).
    // 플랫폼을 정지/재개한다. 소유한 OWNER만 가능하다 (가드에서 소유권 검증).
    public PlatformResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest request) {
        Platform platform = platformService.setSuspended(id, currentAuthenticatedUser.get(), request.suspended());
        return PlatformResponse.from(platform);
    }

    public record UpdateStatusRequest(@NotNull Boolean suspended) {
    }

    public record CreatePlatformRequest(
            @NotBlank String name,
            @NotNull BusinessType businessType,
            String phone,
            String address,
            String description
    ) {
    }

    public record AssignStaffRequest(@NotNull UUID userId, @NotNull StaffRole staffRole) {
    }

    public record PlatformResponse(
            UUID id, String name, BusinessType businessType, String phone, String address,
            String description, String emoji, String colorHex, String status
    ) {
        public static PlatformResponse from(Platform platform) {
            return new PlatformResponse(
                    platform.getId(), platform.getName(), platform.getBusinessType(), platform.getPhone(),
                    platform.getAddress(), platform.getDescription(), platform.getEmoji(),
                    platform.getColorHex(), platform.getStatus().name()
            );
        }
    }

    public record PlatformStaffResponse(UUID id, UUID platformId, UUID userId, StaffRole staffRole) {
        public static PlatformStaffResponse from(PlatformStaff staff) {
            return new PlatformStaffResponse(staff.getId(), staff.getPlatformId(), staff.getUserId(), staff.getStaffRole());
        }
    }
}
