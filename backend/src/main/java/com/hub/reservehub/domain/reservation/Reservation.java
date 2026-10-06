package com.hub.reservehub.domain.reservation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID slotId;

    @Column(nullable = false)
    private UUID userPassId;

    @Column(nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Nullable
    private Instant cancelledAt;

    @Nullable
    private String cancelReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Reservation() {
        // JPA only.
    }

    public Reservation(UUID userId, UUID slotId, UUID userPassId, LocalDate scheduledDate) {
        this.userId = userId;
        this.slotId = slotId;
        this.userPassId = userPassId;
        this.scheduledDate = scheduledDate;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getSlotId() {
        return slotId;
    }

    public UUID getUserPassId() {
        return userPassId;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    @Nullable
    public Instant getCancelledAt() {
        return cancelledAt;
    }

    @Nullable
    public String getCancelReason() {
        return cancelReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void cancel(@Nullable String reason) {
        if (status != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Only a CONFIRMED reservation can be cancelled");
        }
        this.status = ReservationStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
    }

    public void markNoShow() {
        if (status != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Only a CONFIRMED reservation can be marked as NO_SHOW");
        }
        this.status = ReservationStatus.NO_SHOW;
    }
}
