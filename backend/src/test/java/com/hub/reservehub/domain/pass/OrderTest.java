package com.hub.reservehub.domain.pass;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

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
}
