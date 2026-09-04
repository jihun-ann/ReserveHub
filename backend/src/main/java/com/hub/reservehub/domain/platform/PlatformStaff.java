package com.hub.reservehub.domain.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class PlatformStaff {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole staffRole;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private Instant joinedAt;

    @Nullable
    private Instant leftAt;

    // 원천징수 계산용 소득 구분 — 배정 시점엔 미정일 수 있어 nullable.
    @Nullable
    @Enumerated(EnumType.STRING)
    private IncomeType incomeType;

    protected PlatformStaff() {
        // JPA only.
    }

    public PlatformStaff(UUID platformId, UUID userId, StaffRole staffRole) {
        this.platformId = platformId;
        this.userId = userId;
        this.staffRole = staffRole;
        this.joinedAt = Instant.now();
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

    public StaffRole getStaffRole() {
        return staffRole;
    }

    public boolean isActive() {
        return isActive;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    @Nullable
    public Instant getLeftAt() {
        return leftAt;
    }

    @Nullable
    public IncomeType getIncomeType() {
        return incomeType;
    }

    public void changeIncomeType(IncomeType incomeType) {
        this.incomeType = incomeType;
    }

    // Soft-deletes the assignment instead of removing history (AGENT.md 4-4).
    // 이력 보존을 위해 물리 삭제 대신 재직 상태만 해제한다.
    public void leave() {
        this.isActive = false;
        this.leftAt = Instant.now();
    }
}
