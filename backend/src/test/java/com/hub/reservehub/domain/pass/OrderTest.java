package com.hub.reservehub.domain.pass;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class OrderTest {

    private Order newOrder(int finalAmount) {
        return new Order(UUID.randomUUID(), UUID.randomUUID(), finalAmount, 0, finalAmount, null, null);
    }

    @Test
    void payRecordsWhoProcessedIt() {
        Order order = newOrder(100_000);
        UUID manager = UUID.randomUUID();
        order.pay(PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null, manager);
        assertEquals(manager, order.getProcessedBy());
        assertEquals(OrderStatus.PAID, order.getStatus());
    }

    @Test
    void partialPayRecordsProcessorForEachInstallmentAndKeepsLatest() {
        Order order = newOrder(100_000);
        UUID firstStaff = UUID.randomUUID();
        UUID secondStaff = UUID.randomUUID();

        order.partialPay(40_000, PaymentMethod.CASH, CashReceiptStatus.NOT_ISSUED, null, firstStaff);
        assertEquals(OrderStatus.PARTIAL, order.getStatus());
        assertEquals(firstStaff, order.getProcessedBy());

        order.partialPay(60_000, PaymentMethod.CASH, CashReceiptStatus.NOT_ISSUED, null, secondStaff);
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals(secondStaff, order.getProcessedBy());
    }

    @Test
    void unpaidOrderHasNoProcessor() {
        Order order = newOrder(50_000);
        assertNull(order.getProcessedBy());
    }

    @Test
    void refundOfPartialOrderIsCappedByWhatWasActuallyCollected() {
        Order order = newOrder(100_000);
        order.partialPay(10_000, PaymentMethod.CASH, CashReceiptStatus.NOT_ISSUED, null, UUID.randomUUID());
        assertEquals(10_000, order.getRefundableAmount());

        assertThrows(IllegalArgumentException.class, () -> order.refund(10_001), "받은 돈보다 많이 환불할 수 없다");
        assertEquals(0, order.getRefundAmount());

        order.refund(10_000);
        assertEquals(10_000, order.getRefundAmount());
        assertEquals(OrderStatus.REFUNDED, order.getStatus(), "받은 돈을 다 돌려주면 환불 완료");
    }

    @Test
    void partialRefundsAccumulateUntilFullyPaidAmountIsReturned() {
        Order order = newOrder(100_000);
        order.pay(PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null, UUID.randomUUID());

        order.refund(30_000);
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals(70_000, order.getRefundableAmount());

        order.refund(70_000);
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
    }
}
