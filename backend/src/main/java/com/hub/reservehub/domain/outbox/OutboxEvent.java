package com.hub.reservehub.domain.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.lang.Nullable;
import tools.jackson.databind.json.JsonMapper;

/**
 * Transactional Outbox record. Insert this in the same transaction as the business change
 * so the Relay Worker can publish it afterwards without losing events (AGENT.md 5).
 * 트랜잭셔널 아웃박스 레코드. 비즈니스 로직과 같은 트랜잭션에 INSERT해서 Relay Worker가
 * 커밋 이후 안전하게 발행할 수 있게 한다 (AGENT.md 5).
 */
@Entity
public class OutboxEvent {

    private static final JsonMapper JSON = JsonMapper.shared();

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String aggregateType;

    @Column(nullable = false)
    private UUID aggregateId;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String topic;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String payload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String headers = "{}";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(nullable = false)
    private short retryCount = 0;

    @Column(nullable = false)
    private short maxRetries = 5;

    @Nullable
    private String lastError;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Nullable
    private Instant sentAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected OutboxEvent() {
        // JPA only.
    }

    private OutboxEvent(String aggregateType, UUID aggregateId, String eventType, String topic, String payload) {
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.topic = topic;
        this.payload = payload;
        Instant now = Instant.now();
        this.scheduledAt = now;
        this.createdAt = now;
    }

    // Serializes the payload to JSON so callers can pass any domain snapshot object directly.
    // 호출 측이 도메인 스냅샷 객체를 그대로 넘길 수 있도록 payload를 JSON으로 직렬화한다.
    public static OutboxEvent of(String aggregateType, UUID aggregateId, String eventType, String topic, Object payload) {
        return new OutboxEvent(aggregateType, aggregateId, eventType, topic, JSON.writeValueAsString(payload));
    }

    public UUID getId() {
        return id;
    }

    public String getAggregateType() {
        return aggregateType;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getTopic() {
        return topic;
    }

    public String getPayload() {
        return payload;
    }

    public String getHeaders() {
        return headers;
    }

    public OutboxStatus getStatus() {
        return status;
    }

    public short getRetryCount() {
        return retryCount;
    }

    public short getMaxRetries() {
        return maxRetries;
    }

    @Nullable
    public String getLastError() {
        return lastError;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    @Nullable
    public Instant getSentAt() {
        return sentAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void markSent() {
        this.status = OutboxStatus.SENT;
        this.sentAt = Instant.now();
    }

    // Retries until max_retries is exceeded, then marks the event as permanently FAILED.
    // max_retries를 넘기기 전까지는 재시도하고, 넘으면 FAILED로 확정한다.
    public void markFailed(String error) {
        this.retryCount++;
        this.lastError = error;
        if (this.retryCount >= this.maxRetries) {
            this.status = OutboxStatus.FAILED;
        }
    }
}
