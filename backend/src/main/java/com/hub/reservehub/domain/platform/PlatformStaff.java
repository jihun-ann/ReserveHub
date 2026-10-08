package com.hub.reservehub.domain.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "platform_staff")
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

    // 강사 정산용 회당 강사료 — TUTOR 역할에서만 의미를 가진다. 미지정이면 정산액을 계산하지 않는다.
    @Nullable
    private Integer sessionRate;

    // 예전 L/M/H 등급 — 더 이상 권한 검사에 쓰지 않는다(매니저 그룹의 권한으로 대체). 기존 데이터 보존용으로만 남겨둔다.
    @Nullable
    @Enumerated(EnumType.STRING)
    private ManagerTier managerTier;

    // 매니저가 속한 그룹 — 이 그룹의 권한이 곧 매니저의 권한이다. 그룹이 없으면(null) 권한이 없다.
    @Nullable
    private UUID managerGroupId;

    protected PlatformStaff() {
        // JPA only.
    }

    public PlatformStaff(UUID platformId, UUID userId, StaffRole staffRole) {
        this(platformId, userId, staffRole, staffRole == StaffRole.MANAGER ? ManagerTier.LOW : null);
    }

    // 매니저를 배정하며 시작 등급을 바로 지정할 때 사용 — 지정하지 않으면 가장 낮은 LOW로 시작한다
    // (새로 배정된 매니저는 기본적으로 제한된 권한에서 출발해, 이후 HIGH 등급 매니저/오너가 승급시킨다).
    public PlatformStaff(UUID platformId, UUID userId, StaffRole staffRole, @Nullable ManagerTier managerTier) {
        this.platformId = platformId;
        this.userId = userId;
        this.staffRole = staffRole;
        this.managerTier = managerTier;
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

    @Nullable
    public Integer getSessionRate() {
        return sessionRate;
    }

    public void changeSessionRate(int sessionRate) {
        if (sessionRate < 0) {
            throw new IllegalArgumentException("sessionRate must not be negative");
        }
        this.sessionRate = sessionRate;
    }

    @Nullable
    public ManagerTier getManagerTier() {
        return managerTier;
    }

    @Nullable
    public UUID getManagerGroupId() {
        return managerGroupId;
    }

    // 매니저를 그룹에 넣는다 — 권한은 그룹이 가진 ManagerPermission을 따른다.
    public void assignGroup(ManagerGroup group) {
        if (staffRole != StaffRole.MANAGER) {
            throw new IllegalStateException("Only a MANAGER assignment can belong to a manager group");
        }
        this.managerGroupId = group.getId();
    }

    // Soft-deletes the assignment instead of removing history (AGENT.md 4-4).
    // 이력 보존을 위해 물리 삭제 대신 재직 상태만 해제한다.
    public void leave() {
        this.isActive = false;
        this.leftAt = Instant.now();
    }
}
