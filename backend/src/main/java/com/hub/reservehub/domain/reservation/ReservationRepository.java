package com.hub.reservehub.domain.reservation;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface ReservationRepository extends BaseRepository<Reservation, UUID> {
    List<Reservation> findByUserId(UUID userId);

    List<Reservation> findBySlotIdAndScheduledDate(UUID slotId, LocalDate scheduledDate);

    int countBySlotIdAndScheduledDateAndStatus(UUID slotId, LocalDate scheduledDate, ReservationStatus status);

    boolean existsByUserIdAndSlotIdAndScheduledDate(UUID userId, UUID slotId, LocalDate scheduledDate);

    boolean existsByUserIdAndSlotIdAndScheduledDateAndStatusNot(UUID userId, UUID slotId, LocalDate scheduledDate, ReservationStatus status);
}
