package com.hub.reservehub.domain.pass;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "orders")
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

    // Who actually confirmed the payment (pay/partialPay) — may differ from createdBy if the order
    // was registered ahead of time and paid later by a different staff member.
    // 실제 결제(pay/partialPay)를 확정 처리한 사람 — 주문을 미리 등록해두고 나중에 다른 담당자가
    // 결제를 받는 경우 createdBy와 다를 수 있다.
    @Nullable
    private UUID processedBy;

    // 실제 누적 수납액 — finalAmount보다 적으면 PARTIAL, 같거나 크면 PAID.
    @Column(nullable = false)
    private int paidAmount = 0;

    @Nullable
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CashReceiptStatus cashReceiptStatus = CashReceiptStatus.NOT_ISSUED;

    // 카드 승인번호 / 현금영수증 승인번호 등 증빙번호.
    @Nullable
    private String receiptNumber;

    // 누적 환불액 — 부분 환불을 지원하므로 finalAmount보다 적을 수 있다.
    @Column(nullable = false)
    private int refundAmount = 0;

    @Nullable
    private Instant refundedAt;

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

    @Nullable
    public UUID getProcessedBy() {
        return processedBy;
    }

    public int getPaidAmount() {
        return paidAmount;
    }

    @Nullable
    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public CashReceiptStatus getCashReceiptStatus() {
        return cashReceiptStatus;
    }

    @Nullable
    public String getReceiptNumber() {
        return receiptNumber;
    }

    public int getRefundAmount() {
        return refundAmount;
    }

    @Nullable
    public Instant getRefundedAt() {
        return refundedAt;
    }

    // 전액 결제 확정 — 잔금 없이 한 번에 완납하는 기존 흐름.
    public void pay(PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, @Nullable String receiptNumber, UUID processedBy) {
        if (status != OrderStatus.PENDING && status != OrderStatus.PARTIAL) {
            throw new IllegalStateException("Only a PENDING or PARTIAL order can be paid");
        }
        this.paymentMethod = paymentMethod;
        this.cashReceiptStatus = cashReceiptStatus;
        this.receiptNumber = receiptNumber;
        this.paidAmount = finalAmount;
        this.status = OrderStatus.PAID;
        this.paidAt = Instant.now();
        this.processedBy = processedBy;
    }

    // 부분납 — amount만큼 누적 수납하고, 잔액이 남으면 PARTIAL, 다 채워지면 PAID.
    public void partialPay(int amount, PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, @Nullable String receiptNumber, UUID processedBy) {
        if (status != OrderStatus.PENDING && status != OrderStatus.PARTIAL) {
            throw new IllegalStateException("Only a PENDING or PARTIAL order can accept a payment");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        this.paymentMethod = paymentMethod;
        this.cashReceiptStatus = cashReceiptStatus;
        this.receiptNumber = receiptNumber;
        this.paidAmount = Math.min(finalAmount, this.paidAmount + amount);
        this.status = this.paidAmount >= finalAmount ? OrderStatus.PAID : OrderStatus.PARTIAL;
        this.paidAt = Instant.now();
        this.processedBy = processedBy;
    }

    public void cancel() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING order can be cancelled");
        }
        this.status = OrderStatus.CANCELLED;
    }

    // 부분 환불을 지원한다 — 전액이 환불되면 상태를 REFUNDED로, 아니면 현재 상태(PAID/PARTIAL)를 유지한다.
    public void refund(int amount) {
        if (status != OrderStatus.PAID && status != OrderStatus.PARTIAL) {
            throw new IllegalStateException("Only a PAID or PARTIAL order can be refunded");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        this.refundAmount = Math.min(finalAmount, this.refundAmount + amount);
        this.refundedAt = Instant.now();
        if (this.refundAmount >= finalAmount) {
            this.status = OrderStatus.REFUNDED;
        }
    }
}
