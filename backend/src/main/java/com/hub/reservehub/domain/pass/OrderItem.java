package com.hub.reservehub.domain.pass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class OrderItem {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private UUID passId;

    @Column(nullable = false)
    private short quantity = 1;

    // Price snapshot at order time; survives later changes to passes.price (AGENT.md 4-3).
    // 주문 시점 가격 스냅샷. 이후 passes.price 변경과 무관하게 이력 보존.
    @Column(nullable = false)
    private int unitPrice;

    @Column(nullable = false)
    private int lineTotal;

    // 수강과목/반 — 별도 엔티티 없이 기존 Program(수업)을 그대로 과목=반으로 쓴다. FK 아님(참조용).
    @Nullable
    private UUID programId;

    @Nullable
    private LocalDate enrollStart;

    @Nullable
    private LocalDate enrollEnd;

    // 세액 포함/미포함 집계용 — 학원 교습비는 통상 면세라 기본값 EXEMPT.
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TaxType taxType = TaxType.EXEMPT;

    protected OrderItem() {
        // JPA only.
    }

    public OrderItem(UUID orderId, UUID passId, short quantity, int unitPrice) {
        this(orderId, passId, quantity, unitPrice, null, null, null, TaxType.EXEMPT);
    }

    public OrderItem(
            UUID orderId, UUID passId, short quantity, int unitPrice,
            @Nullable UUID programId, @Nullable LocalDate enrollStart, @Nullable LocalDate enrollEnd, TaxType taxType
    ) {
        if (quantity < 1) {
            throw new IllegalArgumentException("quantity must be at least 1");
        }
        this.orderId = orderId;
        this.passId = passId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = quantity * unitPrice;
        this.programId = programId;
        this.enrollStart = enrollStart;
        this.enrollEnd = enrollEnd;
        this.taxType = taxType != null ? taxType : TaxType.EXEMPT;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public UUID getPassId() {
        return passId;
    }

    public short getQuantity() {
        return quantity;
    }

    public int getUnitPrice() {
        return unitPrice;
    }

    public int getLineTotal() {
        return lineTotal;
    }

    @Nullable
    public UUID getProgramId() {
        return programId;
    }

    @Nullable
    public LocalDate getEnrollStart() {
        return enrollStart;
    }

    @Nullable
    public LocalDate getEnrollEnd() {
        return enrollEnd;
    }

    public TaxType getTaxType() {
        return taxType;
    }
}
