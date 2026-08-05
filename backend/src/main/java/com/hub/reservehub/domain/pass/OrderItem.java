package com.hub.reservehub.domain.pass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;

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

    protected OrderItem() {
        // JPA only.
    }

    public OrderItem(UUID orderId, UUID passId, short quantity, int unitPrice) {
        if (quantity < 1) {
            throw new IllegalArgumentException("quantity must be at least 1");
        }
        this.orderId = orderId;
        this.passId = passId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = quantity * unitPrice;
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
}
