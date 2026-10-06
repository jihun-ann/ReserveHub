package com.hub.reservehub.domain.pass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * One step of a sequential (compound) discount application, preserved for history even if the
 * originating policy is later deleted (policyName is a snapshot). AGENT.md 4-3, 9.
 * 순차(복리) 할인 적용 이력 한 단계. 정책이 삭제돼도 policyName 스냅샷으로 이력을 보존한다.
 */
@Entity
@Table(name = "order_discounts")
public class OrderDiscount {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    @Nullable
    private UUID policyId;

    @Column(nullable = false)
    private String policyName;

    @Column(nullable = false)
    private BigDecimal rate;

    // Amount this discount was computed against, i.e. the running total after prior discounts.
    // 이 할인이 적용된 시점의 금액(이전 할인 적용 후 남은 금액) — 복리 할인 추적용.
    @Column(nullable = false)
    private int baseAmount;

    @Column(nullable = false)
    private int discountAmount;

    @Column(nullable = false)
    private short applyOrder;

    protected OrderDiscount() {
        // JPA only.
    }

    public OrderDiscount(
            UUID orderId, @Nullable UUID policyId, String policyName,
            BigDecimal rate, int baseAmount, int discountAmount, short applyOrder
    ) {
        if (applyOrder < 1) {
            throw new IllegalArgumentException("applyOrder must be at least 1");
        }
        this.orderId = orderId;
        this.policyId = policyId;
        this.policyName = policyName;
        this.rate = rate;
        this.baseAmount = baseAmount;
        this.discountAmount = discountAmount;
        this.applyOrder = applyOrder;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrderId() {
        return orderId;
    }

    @Nullable
    public UUID getPolicyId() {
        return policyId;
    }

    public String getPolicyName() {
        return policyName;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public int getBaseAmount() {
        return baseAmount;
    }

    public int getDiscountAmount() {
        return discountAmount;
    }

    public short getApplyOrder() {
        return applyOrder;
    }
}
