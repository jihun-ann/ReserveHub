package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.FinancialRequest;
import com.hub.reservehub.domain.approval.FinancialRequestService;
import com.hub.reservehub.domain.approval.FinancialRequestType;
import com.hub.reservehub.domain.approval.RequestStatus;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TAX_ACCOUNTANT')")
public class FinancialRequestController {

    private final FinancialRequestService financialRequestService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public FinancialRequestController(FinancialRequestService financialRequestService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.financialRequestService = financialRequestService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/financial-requests")
    public ResponseEntity<FinancialRequestResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateRequest request) {
        FinancialRequest created = financialRequestService.create(
                platformId, currentAuthenticatedUser.get(), request.type(), request.title(), request.eventDate(), request.memo()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(FinancialRequestResponse.from(created));
    }

    @GetMapping("/api/v1/platforms/{platformId}/financial-requests")
    public List<FinancialRequestResponse> list(@PathVariable UUID platformId) {
        return financialRequestService.list(platformId, currentAuthenticatedUser.get()).stream()
                .map(FinancialRequestResponse::from)
                .toList();
    }

    @PostMapping("/api/v1/financial-requests/{id}/approve")
    public FinancialRequestResponse approve(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return FinancialRequestResponse.from(financialRequestService.approve(id, currentAuthenticatedUser.get(), memo));
    }

    @PostMapping("/api/v1/financial-requests/{id}/reject")
    public FinancialRequestResponse reject(@PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String memo = request != null ? request.memo() : null;
        return FinancialRequestResponse.from(financialRequestService.reject(id, currentAuthenticatedUser.get(), memo));
    }

    public record CreateRequest(
            @NotNull FinancialRequestType type, @NotBlank String title, @NotNull LocalDate eventDate, String memo
    ) {
    }

    public record DecisionRequest(String memo) {
    }

    public record FinancialRequestResponse(
            UUID id, UUID platformId, UUID requestedBy, FinancialRequestType type, String title,
            LocalDate eventDate, String memo, RequestStatus status, String decisionMemo
    ) {
        public static FinancialRequestResponse from(FinancialRequest request) {
            return new FinancialRequestResponse(
                    request.getId(), request.getPlatformId(), request.getRequestedBy(), request.getType(),
                    request.getTitle(), request.getEventDate(), request.getMemo(), request.getStatus(),
                    request.getDecisionMemo()
            );
        }
    }
}
