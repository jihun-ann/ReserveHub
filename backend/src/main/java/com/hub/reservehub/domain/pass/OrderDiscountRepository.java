package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDiscountRepository extends JpaRepository<OrderDiscount, UUID> {
    List<OrderDiscount> findByOrderIdOrderByApplyOrder(UUID orderId);
}
