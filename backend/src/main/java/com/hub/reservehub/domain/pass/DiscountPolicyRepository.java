package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountPolicyRepository extends JpaRepository<DiscountPolicy, UUID> {
    List<DiscountPolicy> findByPlatformIdAndIsActiveTrue(UUID platformId);

    Optional<DiscountPolicy> findByCouponCodeAndIsActiveTrue(String couponCode);
}
