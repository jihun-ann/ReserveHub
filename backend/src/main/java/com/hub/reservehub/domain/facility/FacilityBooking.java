package com.hub.reservehub.domain.facility;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 시설물의 시간대별 예약 — 같은 시설물+날짜에 시간이 겹치는 CONFIRMED 예약은 동시에 둘 이상 존재할 수 없다
 * (FacilityService.create에서 검증).
 */
@Entity
@Table(name = "facility_bookings")
public class FacilityBooking {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID facilityId;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Nullable
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityBookingStatus status = FacilityBookingStatus.CONFIRMED;

    @Nullable
    private Instant cancelledAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected FacilityBooking() {
        // JPA only.
    }

    public FacilityBooking(
            UUID facilityId, UUID platformId, UUID userId, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime, @Nullable String purpose
    ) {
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        this.facilityId = facilityId;
        this.platformId = platformId;
        this.userId = userId;
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getFacilityId() {
        return facilityId;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    @Nullable
    public String getPurpose() {
        return purpose;
    }

    public FacilityBookingStatus getStatus() {
        return status;
    }

    @Nullable
    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean overlaps(LocalDate date, LocalTime otherStart, LocalTime otherEnd) {
        return status == FacilityBookingStatus.CONFIRMED
                && bookingDate.equals(date)
                && startTime.isBefore(otherEnd)
                && endTime.isAfter(otherStart);
    }

    public void cancel() {
        if (status != FacilityBookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only a CONFIRMED booking can be cancelled");
        }
        this.status = FacilityBookingStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }
}
