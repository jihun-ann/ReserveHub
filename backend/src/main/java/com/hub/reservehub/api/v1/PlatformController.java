package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.IncomeType;
import com.hub.reservehub.domain.platform.ManagerTier;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.domain.platform.PlatformService;
import com.hub.reservehub.domain.platform.PlatformStaff;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
import org.springframework.web.bind.annotation.RequestParam;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(PlatformResponse.from(platform, List.of("OWNER")));
    }

    @GetMapping("/{id}")
    public PlatformResponse getPlatform(@PathVariable UUID id) {
        AuthenticatedUser actor = currentAuthenticatedUser.get();
        return PlatformResponse.from(platformService.get(id, actor), platformService.myRoles(id, actor));
    }

    @GetMapping
    // Lists every platform the caller has any standing on, each tagged with the roles they
    // hold there — the same account can be OWNER on one, MANAGER on another, USER on a third.
    // 호출자가 어떤 자격으로든 관계된 모든 플랫폼을, 그 플랫폼에서 가진 역할들과 함께 반환한다 —
    // 같은 계정이 플랫폼마다 OWNER/MANAGER/USER 등 다른 역할일 수 있다.
    public List<PlatformResponse> listPlatforms() {
        AuthenticatedUser actor = currentAuthenticatedUser.get();
        return platformService.listAccessible(actor).stream()
                .map(platform -> PlatformResponse.from(platform, platformService.myRoles(platform.getId(), actor)))
                .toList();
    }

    @PostMapping("/{id}/staff")
    // Assigns a staff member to the platform; caller must be MANAGER-or-owner on THIS platform,
    // checked in the service against the actual staff record (not the account's global role).
    // 플랫폼에 스태프를 배정한다. 호출자가 이 플랫폼에서 실제로 매니저이거나 소유자인지 서비스에서 검증한다
    // (계정의 전역 role이 아님).
    public ResponseEntity<PlatformStaffResponse> assignStaff(
            @PathVariable UUID id, @Valid @RequestBody AssignStaffRequest request
    ) {
        PlatformStaff staff = platformService.assignStaff(
                id, currentAuthenticatedUser.get(), request.userId(), request.staffRole(), request.managerTier()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PlatformStaffResponse.from(staff));
    }

    @PatchMapping("/{id}/staff/{userId}/manager-tier")
    // 매니저 권한 등급 변경("권한 변경") — 서비스에서 HIGH 등급 매니저 또는 오너만 통과시킨다.
    public PlatformStaffResponse updateManagerTier(
            @PathVariable UUID id, @PathVariable UUID userId, @Valid @RequestBody UpdateManagerTierRequest request
    ) {
        return PlatformStaffResponse.from(
                platformService.updateManagerTier(id, currentAuthenticatedUser.get(), userId, request.managerTier())
        );
    }

    @DeleteMapping("/{id}/staff/{userId}")
    public ResponseEntity<Void> removeStaff(@PathVariable UUID id, @PathVariable UUID userId) {
        platformService.removeStaff(id, currentAuthenticatedUser.get(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/staff")
    public List<PlatformStaffResponse> listStaff(
            @PathVariable UUID id, @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        return platformService.listStaff(id, currentAuthenticatedUser.get(), includeInactive).stream()
                .map(PlatformStaffResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/staff/{userId}/income-type")
    public List<PlatformStaffResponse> updateStaffIncomeType(
            @PathVariable UUID id, @PathVariable UUID userId, @Valid @RequestBody UpdateIncomeTypeRequest request
    ) {
        return platformService.updateStaffIncomeType(id, currentAuthenticatedUser.get(), userId, request.incomeType()).stream()
                .map(PlatformStaffResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/staff/{userId}/session-rate")
    public PlatformStaffResponse updateStaffSessionRate(
            @PathVariable UUID id, @PathVariable UUID userId, @Valid @RequestBody UpdateSessionRateRequest request
    ) {
        return PlatformStaffResponse.from(
                platformService.updateStaffSessionRate(id, currentAuthenticatedUser.get(), userId, request.sessionRate())
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    // Suspends or reactivates a platform; only the owning OWNER may do this (guard checks ownership).
    // 플랫폼을 정지/재개한다. 소유한 OWNER만 가능하다 (가드에서 소유권 검증).
    public PlatformResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest request) {
        AuthenticatedUser actor = currentAuthenticatedUser.get();
        Platform platform = platformService.setSuspended(id, actor, request.suspended());
        return PlatformResponse.from(platform, platformService.myRoles(id, actor));
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

    public record AssignStaffRequest(@NotNull UUID userId, @NotNull StaffRole staffRole, ManagerTier managerTier) {
    }

    public record UpdateManagerTierRequest(@NotNull ManagerTier managerTier) {
    }

    public record UpdateIncomeTypeRequest(@NotNull IncomeType incomeType) {
    }

    public record UpdateSessionRateRequest(@NotNull @PositiveOrZero Integer sessionRate) {
    }

    public record PlatformResponse(
            UUID id, String name, BusinessType businessType, String phone, String address,
            String description, String emoji, String colorHex, String status, List<String> roles
    ) {
        public static PlatformResponse from(Platform platform, List<String> roles) {
            return new PlatformResponse(
                    platform.getId(), platform.getName(), platform.getBusinessType(), platform.getPhone(),
                    platform.getAddress(), platform.getDescription(), platform.getEmoji(),
                    platform.getColorHex(), platform.getStatus().name(), roles
            );
        }
    }

    public record PlatformStaffResponse(
            UUID id, UUID platformId, UUID userId, StaffRole staffRole, boolean isActive,
            IncomeType incomeType, Integer sessionRate, ManagerTier managerTier
    ) {
        public static PlatformStaffResponse from(PlatformStaff staff) {
            return new PlatformStaffResponse(
                    staff.getId(), staff.getPlatformId(), staff.getUserId(), staff.getStaffRole(),
                    staff.isActive(), staff.getIncomeType(), staff.getSessionRate(), staff.getManagerTier()
            );
        }
    }
}
