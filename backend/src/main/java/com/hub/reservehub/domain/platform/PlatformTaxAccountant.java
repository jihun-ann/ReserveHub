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

/**
 * A tax accountant account explicitly invited by the platform's OWNER — unlike PlatformStaff
 * (MANAGER/TUTOR), this isn't a staff role, just a read-only financial access grant.
 * 오너가 명시적으로 초대한 세무사 — MANAGER/TUTOR 같은 스태프가 아니라, 읽기 전용 재무 접근 권한만 부여한다.
 */
@Entity
public class PlatformTaxAccountant {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private Instant joinedAt;

    @Nullable
    private Instant leftAt;

    // 세무사 본인의 소득 구분(보통 사업소득자) — 지정 전엔 nullable.
    @Nullable
    @Enumerated(EnumType.STRING)
    private IncomeType incomeType;

    protected PlatformTaxAccountant() {
        // JPA only.
    }

    public PlatformTaxAccountant(UUID platformId, UUID userId) {
        this.platformId = platformId;
        this.userId = userId;
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

    public void leave() {
        this.isActive = false;
        this.leftAt = Instant.now();
    }

    // 예전에 해지됐던 접근을 다시 초대하는 경우 — 이력을 지우지 않고 재활성화한다.
    public void rejoin() {
        this.isActive = true;
        this.leftAt = null;
        this.joinedAt = Instant.now();
    }
}
