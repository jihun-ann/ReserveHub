package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.JoinRequest;
import com.hub.reservehub.domain.platform.JoinRequestService;
import com.hub.reservehub.domain.platform.JoinRequestStatus;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JoinRequestController {

    private final JoinRequestService joinRequestService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public JoinRequestController(JoinRequestService joinRequestService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.joinRequestService = joinRequestService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    // 회원이 가입 신청할 플랫폼을 이름 또는 ID로 찾는다 — 신청에 필요한 최소 정보만 내려준다.
    @GetMapping("/api/v1/platforms/search")
    public List<PlatformSummary> search(@RequestParam String q) {
        return joinRequestService.search(q).stream().map(PlatformSummary::from).toList();
    }

    @PostMapping("/api/v1/platforms/{platformId}/join-requests")
    public ResponseEntity<MyRequestResponse> apply(@PathVariable UUID platformId, @RequestBody(required = false) ApplyRequest request) {
        JoinRequest created = joinRequestService.apply(platformId, currentAuthenticatedUser.get(), request == null ? null : request.message());
        return ResponseEntity.status(HttpStatus.CREATED).body(new MyRequestResponse(
                created.getId(), created.getPlatformId(), null, created.getStatus(), created.getMessage(),
                created.getDecisionMemo(), created.getCreatedAt(), created.getDecidedAt()));
    }

    @GetMapping("/api/v1/join-requests/mine")
    public List<MyRequestResponse> mine() {
        return joinRequestService.listMine(currentAuthenticatedUser.get()).stream().map(MyRequestResponse::from).toList();
    }

    @PostMapping("/api/v1/join-requests/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        joinRequestService.cancel(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/platforms/{platformId}/join-requests")
    public List<PlatformRequestResponse> listForPlatform(@PathVariable UUID platformId) {
        return joinRequestService.listForPlatform(platformId, currentAuthenticatedUser.get()).stream().map(PlatformRequestResponse::from).toList();
    }

    @PostMapping("/api/v1/join-requests/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable UUID id, @Valid @RequestBody(required = false) DecisionRequest request) {
        joinRequestService.approve(id, currentAuthenticatedUser.get(), request == null ? null : request.memo());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/join-requests/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable UUID id, @Valid @RequestBody(required = false) DecisionRequest request) {
        joinRequestService.reject(id, currentAuthenticatedUser.get(), request == null ? null : request.memo());
        return ResponseEntity.noContent().build();
    }

    public record ApplyRequest(@Nullable String message) {
    }

    public record DecisionRequest(@Nullable String memo) {
    }

    public record PlatformSummary(UUID id, String code, String name, BusinessType businessType, @Nullable String address, @Nullable String description) {
        static PlatformSummary from(Platform p) {
            return new PlatformSummary(p.getId(), p.getCode(), p.getName(), p.getBusinessType(), p.getAddress(), p.getDescription());
        }
    }

    public record MyRequestResponse(
            UUID id, UUID platformId, @Nullable String platformName, JoinRequestStatus status, @Nullable String message,
            @Nullable String decisionMemo, Instant createdAt, @Nullable Instant decidedAt
    ) {
        static MyRequestResponse from(JoinRequestService.WithPlatform w) {
            JoinRequest r = w.request();
            return new MyRequestResponse(r.getId(), r.getPlatformId(), w.platformName(), r.getStatus(), r.getMessage(),
                    r.getDecisionMemo(), r.getCreatedAt(), r.getDecidedAt());
        }
    }

    public record PlatformRequestResponse(
            UUID id, UUID userId, String userName, String userEmail, @Nullable String userPhone, JoinRequestStatus status,
            @Nullable String message, Instant createdAt
    ) {
        static PlatformRequestResponse from(JoinRequestService.WithUser w) {
            JoinRequest r = w.request();
            return new PlatformRequestResponse(r.getId(), r.getUserId(), w.user().getName(), w.user().getEmail(), w.user().getPhone(),
                    r.getStatus(), r.getMessage(), r.getCreatedAt());
        }
    }
}
