package com.hub.reservehub.domain.pass;

public enum OrderStatus {
    PENDING,   // 미납
    PARTIAL,   // 부분납
    PAID,      // 결제완료
    CANCELLED,
    REFUNDED   // 환불 (전액 환불 시)
}
