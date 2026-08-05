package com.hub.reservehub.domain.pass;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class Order extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID platformId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false)
    private int originalAmount;

    @Column(nullable = false)
    private int discountAmount;

    @Column(nullable = false)
    private int finalAmount;

    @Nullable
    private Instant paidAt;

    @Nullable
    private String memo;

    // Staff who registered the order on the buyer's behalf (counter sale); NULL means self-checkout.
    // 상담 처리한 스태프. NULL이면 본인 결제.
    @Nullable
    private UUID createdBy;

    protected Order() {
        // JPA only.
    }

    public Order(UUID userId, UUID platformId, int originalAmount, int discountAmount, int finalAmount, @Nullable String memo, @Nullable UUID createdBy) {
        if (finalAmount < 0) {
            throw new IllegalArgumentException("finalAmount must not be negative");
        }
        this.userId = userId;
        this.platformId = platformId;
        this.originalAmount = originalAmount;
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
        this.memo = memo;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public int getOriginalAmount() {
        return originalAmount;
    }

    public int getDiscountAmount() {
        return discountAmount;
    }

    public int getFinalAmount() {
        return finalAmount;
    }

    @Nullable
    public Instant getPaidAt() {
        return paidAt;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    @Nullable
    public UUID getCreatedBy() {
        return createdBy;
    }

    public void pay() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING order can be paid");
        }
        this.status = OrderStatus.PAID;
        this.paidAt = Instant.now();
    }

    public void cancel() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING order can be cancelled");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public void refund() {
        if (status != OrderStatus.PAID) {
            throw new IllegalStateException("Only a PAID order can be refunded");
        }
        this.status = OrderStatus.REFUNDED;
    }
}
