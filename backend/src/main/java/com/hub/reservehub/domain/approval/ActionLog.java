package com.hub.reservehub.domain.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * Immutable audit trail entry. Never updated or deleted after creation (AGENT.md 4-2, 4-4).
 * 불변 처리 이력. 생성 후 절대 수정·삭제하지 않는다.
 */
@Entity
public class ActionLog {

    @Id
    @GeneratedValue
    private UUID id;

    @Nullable
    private UUID platformId;

    @Column(nullable = false)
    private UUID actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionTarget targetType;

    @Column(nullable = false)
    private UUID targetId;

    @Column(nullable = false)
    private String action;

    @Nullable
    private String memo;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ActionLog() {
        // JPA only.
    }

    private ActionLog(@Nullable UUID platformId, UUID actorId, ActionTarget targetType, UUID targetId, String action, @Nullable String memo) {
        this.platformId = platformId;
        this.actorId = actorId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.action = action;
        this.memo = memo;
        this.createdAt = Instant.now();
    }

    public static ActionLog of(
            @Nullable UUID platformId, UUID actorId, ActionTarget targetType, UUID targetId, String action, @Nullable String memo
    ) {
        return new ActionLog(platformId, actorId, targetType, targetId, action, memo);
    }

    public UUID getId() {
        return id;
    }

    @Nullable
    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getActorId() {
        return actorId;
    }

    public ActionTarget getTargetType() {
        return targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public String getAction() {
        return action;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
