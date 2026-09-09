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

    // 이 프로그램을 구매하는 수강권 — 지정되어 있으면 표시용 이름은 항상 이 수강권의 이름을 조회해서
    // 쓴다(ProgramService.list/get에서 join). name 컬럼은 생성 시점 스냅샷일 뿐이라 나중에 수강권
    // 이름이 바뀌어도 이 값 자체는 갱신되지 않는다 — 항상 최신값이 필요하면 passId로 다시 조회해야 한다.
    // 세무사 등 수강권 카탈로그와 무관하게 프로그램만 볼 때를 위해 남겨둔 참고용 필드.
    @Nullable
    private UUID passId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgramType type = ProgramType.GROUP;

    // GROUP에서만 실제로 선택되는 값 — PRIVATE는 항상 FIXED로 취급한다(isFixedRoster() 참고).
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentMode enrollmentMode = EnrollmentMode.FIXED;

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

    public Program(
            UUID platformId, String name, ProgramType type, EnrollmentMode enrollmentMode, short capacity, short durationMin,
            @Nullable String description, @Nullable UUID passId
    ) {
        this.platformId = platformId;
        this.name = name;
        this.passId = passId;
        applyDetails(type, enrollmentMode, capacity, durationMin, description);
    }

    public void update(ProgramType type, @Nullable EnrollmentMode enrollmentMode, short capacity, short durationMin, @Nullable String description) {
        applyDetails(type, enrollmentMode, capacity, durationMin, description);
    }

    private void applyDetails(ProgramType type, @Nullable EnrollmentMode enrollmentMode, short capacity, short durationMin, @Nullable String description) {
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1");
        }
        if (durationMin <= 0) {
            throw new IllegalArgumentException("durationMin must be positive");
        }
        this.type = type;
        // PRIVATE는 항상 고정 배정이라 선택의 여지가 없다 — GROUP일 때만 입력값을 그대로 쓴다.
        this.enrollmentMode = type == ProgramType.PRIVATE ? EnrollmentMode.FIXED : enrollmentMode;
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

    @Nullable
    public UUID getPassId() {
        return passId;
    }

    public ProgramType getType() {
        return type;
    }

    public EnrollmentMode getEnrollmentMode() {
        return enrollmentMode;
    }

    // 이 프로그램의 슬롯이 고정 로스터(SlotMember)를 쓰는지 — PRIVATE는 항상, GROUP은 FIXED로 설정된
    // 경우만. false면 신청형(Reservation을 학생이 직접 매주 생성)이다.
    public boolean isFixedRoster() {
        return type == ProgramType.PRIVATE || enrollmentMode == EnrollmentMode.FIXED;
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
