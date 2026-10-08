package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.InvitationStatus;
import com.hub.reservehub.domain.platform.ManagerTier;
import com.hub.reservehub.domain.platform.StaffInvitation;
import com.hub.reservehub.domain.platform.StaffInvitationService;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StaffInvitationController {

    private final StaffInvitationService invitationService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public StaffInvitationController(StaffInvitationService invitationService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.invitationService = invitationService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/staff-invitations")
    public ResponseEntity<InvitationResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateInvitationRequest request) {
        StaffInvitation invitation = invitationService.create(
                platformId, currentAuthenticatedUser.get(), request.staffRole(), request.managerTier(), request.email(), request.phone()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(InvitationResponse.from(invitation));
    }

    @GetMapping("/api/v1/platforms/{platformId}/staff-invitations")
    public List<InvitationResponse> listPending(@PathVariable UUID platformId) {
        return invitationService.listPending(platformId, currentAuthenticatedUser.get()).stream().map(InvitationResponse::from).toList();
    }

    @PostMapping("/api/v1/staff-invitations/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        invitationService.cancel(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    // 로그인 전에도 열 수 있는 공개 조회(SecurityConfig permitAll) — 링크의 token 자체가 비밀이다.
    @GetMapping("/api/v1/staff-invitations/token/{token}")
    public PreviewResponse preview(@PathVariable String token) {
        StaffInvitationService.Preview preview = invitationService.preview(token);
        StaffInvitation i = preview.invitation();
        return new PreviewResponse(
                preview.platformName(), i.getStaffRole(), i.getManagerTier(), i.getEmail(), i.getPhone(),
                i.getStatus(), i.isExpired()
        );
    }

    @PostMapping("/api/v1/staff-invitations/token/{token}/accept")
    public ResponseEntity<Void> accept(@PathVariable String token) {
        invitationService.accept(token, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record CreateInvitationRequest(
            @NotNull StaffRole staffRole, @Nullable ManagerTier managerTier, @Nullable String email, @Nullable String phone
    ) {
    }

    public record InvitationResponse(
            UUID id, String token, StaffRole staffRole, @Nullable ManagerTier managerTier,
            @Nullable String email, @Nullable String phone, InvitationStatus status, Instant expiresAt
    ) {
        static InvitationResponse from(StaffInvitation i) {
            return new InvitationResponse(
                    i.getId(), i.getToken(), i.getStaffRole(), i.getManagerTier(), i.getEmail(), i.getPhone(), i.getStatus(), i.getExpiresAt()
            );
        }
    }

    public record PreviewResponse(
            String platformName, StaffRole staffRole, @Nullable ManagerTier managerTier,
            @Nullable String email, @Nullable String phone, InvitationStatus status, boolean expired
    ) {
    }
}
