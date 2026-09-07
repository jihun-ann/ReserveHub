package com.hub.reservehub.domain.program;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class Slot {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID programId;

    // 이 슬롯(수업 인스턴스) 자체의 이름 — 같은 프로그램 안에서 요일/시간이 다른 여러 반을 구분할 때
    // 쓴다 (예: "그룹반A", "그룹반B"). 없으면 화면에서 프로그램 이름으로 대체 표시한다.
    @Nullable
    private String name;

    @Column(nullable = false)
    private UUID instructorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private LocalDate validFrom;

    @Nullable
    private LocalDate validUntil;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Slot() {
        // JPA only.
    }

    public Slot(
            UUID programId, @Nullable String name, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, @Nullable LocalDate validUntil
    ) {
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        this.programId = programId;
        this.name = name;
        this.instructorId = instructorId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getProgramId() {
        return programId;
    }

    @Nullable
    public String getName() {
        return name;
    }

    public UUID getInstructorId() {
        return instructorId;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    @Nullable
    public LocalDate getValidUntil() {
        return validUntil;
    }

    public boolean isActive() {
        return isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
