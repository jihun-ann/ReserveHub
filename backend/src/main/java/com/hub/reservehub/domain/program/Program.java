package com.hub.reservehub.domain.program;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class Program extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgramType type = ProgramType.GROUP;

    @Column(nullable = false)
    private short capacity = 8;

    @Column(nullable = false)
    private short durationMin = 60;

    @Nullable
    private String description;

    @Column(nullable = false)
    private boolean isActive = true;

    protected Program() {
        // JPA only.
    }

    public Program(UUID platformId, String name, ProgramType type, short capacity, short durationMin, @Nullable String description) {
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1");
        }
        if (durationMin <= 0) {
            throw new IllegalArgumentException("durationMin must be positive");
        }
        this.platformId = platformId;
        this.name = name;
        this.type = type;
        this.capacity = capacity;
        this.durationMin = durationMin;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public String getName() {
        return name;
    }

    public ProgramType getType() {
        return type;
    }

    public short getCapacity() {
        return capacity;
    }

    public short getDurationMin() {
        return durationMin;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return isActive;
    }

    // Soft delete: keeps history for existing reservations/orders instead of removing the row (AGENT.md 4-4).
    // 소프트 삭제: 기존 예약/주문 이력을 보존하기 위해 로우를 지우지 않는다.
    public void deactivate() {
        this.isActive = false;
    }
}
