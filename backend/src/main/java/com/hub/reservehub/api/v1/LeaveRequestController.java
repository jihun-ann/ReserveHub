package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.LeaveRequest;
import com.hub.reservehub.domain.approval.LeaveRequestService;
import com.hub.reservehub.domain.approval.RequestStatus;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TUTOR')")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public LeaveRequestController(LeaveRequestService leaveRequestService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.leaveRequestService = leaveRequestService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/leave-requests")
    public ResponseEntity<LeaveRequestResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateRequest request) {
        LeaveRequest created = leaveRequestService.create(
                platformId, currentAuthenticatedUser.get(), request.startDate(), request.endDate(), request.reason()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(LeaveRequestResponse.from(created));
    }

    @GetMapping("/api/v1/platforms/{platformId}/leave-requests")
    public List<LeaveRequestResponse> list(@PathVariable UUID platformId, @RequestParam(defaultValue = "PENDING") RequestStatus status) {
        return leaveRequestService.list(platformId, currentAuthenticatedUser.get(), status).stream()
                .map(LeaveRequestResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/leave-requests/me")
    public List<LeaveRequestResponse> listMine() {
        return leaveRequestService.listMine(currentAuthenticatedUser.get()).stream().map(LeaveRequestResponse::from).toList();
    }

    @PostMapping("/api/v1/leave-requests/{id}/approve")
    public LeaveRequestResponse approve(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return LeaveRequestResponse.from(leaveRequestService.approve(id, currentAuthenticatedUser.get(), memo));
    }

    @PostMapping("/api/v1/leave-requests/{id}/reject")
    public LeaveRequestResponse reject(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return LeaveRequestResponse.from(leaveRequestService.reject(id, currentAuthenticatedUser.get(), memo));
    }

    public record CreateRequest(@NotNull LocalDate startDate, @NotNull LocalDate endDate, String reason) {
    }

    public record DecisionRequest(String memo) {
    }

    public record LeaveRequestResponse(
            UUID id, UUID platformId, UUID requestedBy, LocalDate startDate, LocalDate endDate, String reason,
            RequestStatus status, String decisionMemo, UUID decidedBy, Instant createdAt, Instant updatedAt
    ) {
        public static LeaveRequestResponse from(LeaveRequest request) {
            return new LeaveRequestResponse(
                    request.getId(), request.getPlatformId(), request.getRequestedBy(), request.getStartDate(),
                    request.getEndDate(), request.getReason(), request.getStatus(), request.getDecisionMemo(),
                    request.getDecidedBy(), request.getCreatedAt(), request.getUpdatedAt()
            );
        }
    }
}
