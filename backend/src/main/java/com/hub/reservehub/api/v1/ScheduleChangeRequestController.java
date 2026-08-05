package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.RequestStatus;
import com.hub.reservehub.domain.approval.ScheduleChangeRequest;
import com.hub.reservehub.domain.approval.ScheduleChangeRequestService;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
public class ScheduleChangeRequestController {

    private final ScheduleChangeRequestService scheduleChangeRequestService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public ScheduleChangeRequestController(ScheduleChangeRequestService scheduleChangeRequestService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.scheduleChangeRequestService = scheduleChangeRequestService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/schedule-requests")
    public ResponseEntity<ScheduleChangeRequestResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateRequest request) {
        ScheduleChangeRequest created = scheduleChangeRequestService.create(
                platformId, currentAuthenticatedUser.get(), request.reservationId(),
                request.requestedDate(), request.requestedSlot(), request.reason()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ScheduleChangeRequestResponse.from(created));
    }

    @GetMapping("/api/v1/platforms/{platformId}/schedule-requests")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public List<ScheduleChangeRequestResponse> list(@PathVariable UUID platformId, @RequestParam(defaultValue = "PENDING") RequestStatus status) {
        return scheduleChangeRequestService.list(platformId, currentAuthenticatedUser.get(), status).stream()
                .map(ScheduleChangeRequestResponse::from)
                .toList();
    }

    @PostMapping("/api/v1/schedule-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ScheduleChangeRequestResponse approve(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return ScheduleChangeRequestResponse.from(scheduleChangeRequestService.approve(id, currentAuthenticatedUser.get(), memo));
    }

    @PostMapping("/api/v1/schedule-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ScheduleChangeRequestResponse reject(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return ScheduleChangeRequestResponse.from(scheduleChangeRequestService.reject(id, currentAuthenticatedUser.get(), memo));
    }

    public record CreateRequest(@NotNull UUID reservationId, @NotNull LocalDate requestedDate, UUID requestedSlot, String reason) {
    }

    public record DecisionRequest(String memo) {
    }

    public record ScheduleChangeRequestResponse(
            UUID id, UUID platformId, UUID requestedBy, UUID reservationId, LocalDate originalDate,
            UUID originalSlot, LocalDate requestedDate, UUID requestedSlot, String reason, RequestStatus status
    ) {
        public static ScheduleChangeRequestResponse from(ScheduleChangeRequest request) {
            return new ScheduleChangeRequestResponse(
                    request.getId(), request.getPlatformId(), request.getRequestedBy(), request.getReservationId(),
                    request.getOriginalDate(), request.getOriginalSlot(), request.getRequestedDate(),
                    request.getRequestedSlot(), request.getReason(), request.getStatus()
            );
        }
    }
}
