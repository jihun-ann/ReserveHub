package com.hub.reservehub.domain.lesson;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID slotId;

    @Column(nullable = false)
    private UUID instructorId;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID programId;

    @Column(nullable = false)
    private LocalDate lessonDate;

    @Nullable
    private Instant startedAt;

    @Nullable
    private Instant endedAt;

    @Nullable
    private String memo;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Lesson() {
        // JPA only.
    }

    public Lesson(UUID slotId, UUID instructorId, UUID platformId, UUID programId, LocalDate lessonDate) {
        this.slotId = slotId;
        this.instructorId = instructorId;
        this.platformId = platformId;
        this.programId = programId;
        this.lessonDate = lessonDate;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getSlotId() {
        return slotId;
    }

    public UUID getInstructorId() {
        return instructorId;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getProgramId() {
        return programId;
    }

    public LocalDate getLessonDate() {
        return lessonDate;
    }

    @Nullable
    public Instant getStartedAt() {
        return startedAt;
    }

    @Nullable
    public Instant getEndedAt() {
        return endedAt;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void start() {
        if (startedAt != null) {
            throw new IllegalStateException("Lesson already started");
        }
        this.startedAt = Instant.now();
    }

    public void end() {
        if (startedAt == null) {
            throw new IllegalStateException("Lesson has not started yet");
        }
        if (endedAt != null) {
            throw new IllegalStateException("Lesson already ended");
        }
        this.endedAt = Instant.now();
    }
}
