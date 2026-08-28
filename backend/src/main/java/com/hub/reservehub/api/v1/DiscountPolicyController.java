package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.pass.DiscountPolicy;
import com.hub.reservehub.domain.pass.DiscountPolicyService;
import com.hub.reservehub.domain.pass.DiscountType;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class DiscountPolicyController {

    private final DiscountPolicyService discountPolicyService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public DiscountPolicyController(DiscountPolicyService discountPolicyService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.discountPolicyService = discountPolicyService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/discount-policies")
    public ResponseEntity<DiscountPolicyResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateDiscountPolicyRequest request) {
        DiscountPolicy policy = discountPolicyService.create(
                platformId, currentAuthenticatedUser.get(), request.name(), request.type(), request.rate(),
                request.conditionValue(), request.couponCode(), request.expiresAt(), request.memo()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(DiscountPolicyResponse.from(policy));
    }

    @GetMapping("/api/v1/platforms/{platformId}/discount-policies")
    public List<DiscountPolicyResponse> list(@PathVariable UUID platformId) {
        return discountPolicyService.list(platformId, currentAuthenticatedUser.get()).stream()
                .map(DiscountPolicyResponse::from)
                .toList();
    }

    @DeleteMapping("/api/v1/discount-policies/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        discountPolicyService.deactivate(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record CreateDiscountPolicyRequest(
            @NotBlank String name,
            @NotNull DiscountType type,
            @NotNull BigDecimal rate,
            Integer conditionValue,
            String couponCode,
            Instant expiresAt,
            String memo
    ) {
    }

    public record DiscountPolicyResponse(
            UUID id, UUID platformId, String name, DiscountType type, BigDecimal rate,
            Integer conditionValue, String couponCode, Instant expiresAt, boolean isActive
    ) {
        public static DiscountPolicyResponse from(DiscountPolicy policy) {
            return new DiscountPolicyResponse(
                    policy.getId(), policy.getPlatformId(), policy.getName(), policy.getType(), policy.getRate(),
                    policy.getConditionValue(), policy.getCouponCode(), policy.getExpiresAt(), policy.isActive()
            );
        }
    }
}
