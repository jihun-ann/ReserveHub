package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface DiscountPolicyRepository extends BaseRepository<DiscountPolicy, UUID> {
    List<DiscountPolicy> findByPlatformIdAndIsActiveTrue(UUID platformId);

    Optional<DiscountPolicy> findByCouponCodeAndIsActiveTrue(String couponCode);
}
