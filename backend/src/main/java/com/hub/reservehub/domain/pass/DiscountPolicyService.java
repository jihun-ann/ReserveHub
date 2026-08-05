package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DiscountPolicyService {

    private final DiscountPolicyRepository discountPolicyRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public DiscountPolicyService(DiscountPolicyRepository discountPolicyRepository, PlatformAccessGuard platformAccessGuard) {
        this.discountPolicyRepository = discountPolicyRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    public DiscountPolicy create(
            UUID platformId, AuthenticatedUser actor, String name, DiscountType type, BigDecimal rate,
            @Nullable Integer conditionValue, @Nullable String couponCode, @Nullable Instant expiresAt, @Nullable String memo
    ) {
        platformAccessGuard.verify(platformId, actor);
        return discountPolicyRepository.save(
                new DiscountPolicy(platformId, name, type, rate, conditionValue, couponCode, expiresAt, memo, actor.getId())
        );
    }

    @Transactional(readOnly = true)
    // Staff-only management view (not shown to customers) — coupon codes shouldn't be publicly listable.
    // 스태프 전용 관리 화면 (고객에게 노출 안 함) — 쿠폰 코드가 공개 목록에 나오면 안 되기 때문.
    public List<DiscountPolicy> list(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verify(platformId, actor);
        return discountPolicyRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional
    public void deactivate(UUID policyId, AuthenticatedUser actor) {
        DiscountPolicy policy = findPolicy(policyId);
        platformAccessGuard.verify(policy.getPlatformId(), actor);
        policy.deactivate();
    }

    private DiscountPolicy findPolicy(UUID policyId) {
        return discountPolicyRepository.findById(policyId)
                .orElseThrow(() -> new IllegalArgumentException("Discount policy not found"));
    }
}
