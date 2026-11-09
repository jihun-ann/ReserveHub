package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.WorkRequest;
import com.hub.reservehub.domain.approval.WorkRequestService;
import com.hub.reservehub.domain.approval.WorkRequestStatus;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TAX_ACCOUNTANT')")
public class WorkRequestController {

    private final WorkRequestService workRequestService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public WorkRequestController(WorkRequestService workRequestService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.workRequestService = workRequestService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/work-requests")
    public ResponseEntity<WorkRequestResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateRequest request) {
        WorkRequest created = workRequestService.create(
                platformId, currentAuthenticatedUser.get(), request.assigneeId(), request.title(), request.memo(), request.dueDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(WorkRequestResponse.from(created));
    }

    @GetMapping("/api/v1/platforms/{platformId}/work-requests")
    public List<WorkRequestResponse> list(@PathVariable UUID platformId) {
        return workRequestService.list(platformId, currentAuthenticatedUser.get()).stream()
                .map(WorkRequestResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/platforms/{platformId}/work-requests/assignees")
    public List<WorkRequestService.Assignee> assignees(@PathVariable UUID platformId) {
        return workRequestService.assignees(platformId, currentAuthenticatedUser.get());
    }

    @PostMapping("/api/v1/work-requests/{id}/status")
    public WorkRequestResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return WorkRequestResponse.from(workRequestService.changeStatus(id, currentAuthenticatedUser.get(), request.status()));
    }

    public record CreateRequest(
            @NotNull UUID assigneeId, @NotBlank @Size(max = 200) String title, String memo, LocalDate dueDate
    ) {
    }

    public record StatusRequest(@NotNull WorkRequestStatus status) {
    }

    public record WorkRequestResponse(
            UUID id, UUID platformId, UUID requestedBy, UUID assigneeId, String title, String memo,
            LocalDate dueDate, WorkRequestStatus status, Instant createdAt, Instant updatedAt
    ) {
        public static WorkRequestResponse from(WorkRequest request) {
            return new WorkRequestResponse(
                    request.getId(), request.getPlatformId(), request.getRequestedBy(), request.getAssigneeId(),
                    request.getTitle(), request.getMemo(), request.getDueDate(), request.getStatus(),
                    request.getCreatedAt(), request.getUpdatedAt()
            );
        }
    }
}
