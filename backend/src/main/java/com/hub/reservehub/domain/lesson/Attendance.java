package com.hub.reservehub.domain.lesson;

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
public class Attendance {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID lessonId;

    @Column(nullable = false)
    private UUID userId;

    @Nullable
    private UUID reservationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendStatus status = AttendStatus.PRESENT;

    @Column(nullable = false)
    private Instant checkedAt;

    // Instructor or staff who recorded the attendance.
    // 출결을 처리한 강사 또는 스태프.
    @Nullable
    private UUID checkedBy;

    @Nullable
    private String memo;

    protected Attendance() {
        // JPA only.
    }

    public Attendance(UUID lessonId, UUID userId, @Nullable UUID reservationId, AttendStatus status, @Nullable UUID checkedBy, @Nullable String memo) {
        this.lessonId = lessonId;
        this.userId = userId;
        this.reservationId = reservationId;
        this.status = status;
        this.checkedAt = Instant.now();
        this.checkedBy = checkedBy;
        this.memo = memo;
    }

    public UUID getId() {
        return id;
    }

    public UUID getLessonId() {
        return lessonId;
    }

    public UUID getUserId() {
        return userId;
    }

    @Nullable
    public UUID getReservationId() {
        return reservationId;
    }

    public AttendStatus getStatus() {
        return status;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    @Nullable
    public UUID getCheckedBy() {
        return checkedBy;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }
}
