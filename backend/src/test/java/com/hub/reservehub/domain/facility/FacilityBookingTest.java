package com.hub.reservehub.domain.facility;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FacilityBookingTest {

    private static final LocalDate DATE = LocalDate.of(2026, 9, 8);

    private FacilityBooking booking(LocalTime start, LocalTime end) {
        return new FacilityBooking(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), DATE, start, end, null);
    }

    @Test
    void overlappingRangeIsDetected() {
        FacilityBooking existing = booking(LocalTime.of(10, 0), LocalTime.of(11, 0));
        assertTrue(existing.overlaps(DATE, LocalTime.of(10, 30), LocalTime.of(11, 30)));
    }

    @Test
    void backToBackRangesDoNotOverlap() {
        FacilityBooking existing = booking(LocalTime.of(10, 0), LocalTime.of(11, 0));
        assertFalse(existing.overlaps(DATE, LocalTime.of(11, 0), LocalTime.of(12, 0)));
    }

    @Test
    void differentDateNeverOverlaps() {
        FacilityBooking existing = booking(LocalTime.of(10, 0), LocalTime.of(11, 0));
        assertFalse(existing.overlaps(DATE.plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0)));
    }

    @Test
    void cancelledBookingNeverOverlaps() {
        FacilityBooking existing = booking(LocalTime.of(10, 0), LocalTime.of(11, 0));
        existing.cancel();
        assertFalse(existing.overlaps(DATE, LocalTime.of(10, 0), LocalTime.of(11, 0)));
    }
}
