package com.hub.reservehub.domain.pass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class UserPass {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID orderItemId;

    @Column(nullable = false)
    private UUID passId;

    @Column(nullable = false)
    private UUID platformId;

    // NULL means unlimited within the validity period (MONTHLY-type passes).
    // NULL이면 기간 내 무제한 (MONTHLY 타입).
    @Nullable
    private Integer sessionsTotal;

    @Column(nullable = false)
    private int sessionsUsed = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserPassStatus status = UserPassStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDate startedAt;

    @Column(nullable = false)
    private LocalDate expiresAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected UserPass() {
        // JPA only.
    }

    public UserPass(UUID userId, UUID orderItemId, UUID passId, UUID platformId, @Nullable Integer sessionsTotal, LocalDate startedAt, LocalDate expiresAt) {
        this.userId = userId;
        this.orderItemId = orderItemId;
        this.passId = passId;
        this.platformId = platformId;
        this.sessionsTotal = sessionsTotal;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getOrderItemId() {
        return orderItemId;
    }

    public UUID getPassId() {
        return passId;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    @Nullable
    public Integer getSessionsTotal() {
        return sessionsTotal;
    }

    public int getSessionsUsed() {
        return sessionsUsed;
    }

    public UserPassStatus getStatus() {
        return status;
    }

    public LocalDate getStartedAt() {
        return startedAt;
    }

    public LocalDate getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // Called on reservation confirm/attendance to deduct a session (AGENT.md event: user_pass consumption).
    // 예약 확정/출석 처리 시 세션을 차감한다.
    public void useSession() {
        if (status != UserPassStatus.ACTIVE) {
            throw new IllegalStateException("Pass is not ACTIVE");
        }
        if (expiresAt.isBefore(LocalDate.now())) {
            throw new IllegalStateException("Pass has expired");
        }
        if (sessionsTotal != null && sessionsUsed >= sessionsTotal) {
            throw new IllegalStateException("No sessions remaining");
        }
        this.sessionsUsed++;
    }

    public void suspend() {
        this.status = UserPassStatus.SUSPENDED;
    }

    public void reactivate() {
        if (status != UserPassStatus.SUSPENDED) {
            throw new IllegalStateException("Only a SUSPENDED pass can be reactivated");
        }
        this.status = UserPassStatus.ACTIVE;
    }
}
