package com.hub.reservehub.domain.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 회원이 플랫폼에 보낸 가입 신청 — 센터가 승인/반려하고, 승인된 뒤에 수강권/프로그램을 등록한다.
 * 같은 플랫폼에 대기 중(PENDING) 신청은 사용자당 하나만 둔다(DB 부분 유니크 인덱스).
 */
@Entity
@Table(name = "platform_join_requests")
public class JoinRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JoinRequestStatus status = JoinRequestStatus.PENDING;

    // 회원이 적은 문의/희망 프로그램 같은 메모
    @Nullable
    private String message;

    @Nullable
    private UUID decidedBy;

    @Nullable
    private String decisionMemo;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Nullable
    private Instant decidedAt;

    protected JoinRequest() {
        // JPA only.
    }

    public JoinRequest(UUID platformId, UUID userId, @Nullable String message) {
        this.platformId = platformId;
        this.userId = userId;
        this.message = message;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getUserId() {
        return userId;
    }

    public JoinRequestStatus getStatus() {
        return status;
    }

    @Nullable
    public String getMessage() {
        return message;
    }

    @Nullable
    public UUID getDecidedBy() {
        return decidedBy;
    }

    @Nullable
    public String getDecisionMemo() {
        return decisionMemo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Nullable
    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void approve(UUID actorId, @Nullable String memo) {
        decide(JoinRequestStatus.APPROVED, actorId, memo);
    }

    public void reject(UUID actorId, @Nullable String memo) {
        decide(JoinRequestStatus.REJECTED, actorId, memo);
    }

    public void cancel() {
        requirePending();
        this.status = JoinRequestStatus.CANCELLED;
        this.decidedAt = Instant.now();
    }

    private void decide(JoinRequestStatus next, UUID actorId, @Nullable String memo) {
        requirePending();
        this.status = next;
        this.decidedBy = actorId;
        this.decisionMemo = memo;
        this.decidedAt = Instant.now();
    }

    private void requirePending() {
        if (status != JoinRequestStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 신청입니다.");
        }
    }
}
