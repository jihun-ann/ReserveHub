package com.hub.reservehub.domain.outbox;

public enum OutboxStatus {
    PENDING,
    SENT,
    FAILED,
    SKIPPED
}
