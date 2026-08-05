package com.hub.reservehub.domain.calendar;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
    List<CalendarEvent> findByPlatformIdAndEventDateBetween(UUID platformId, LocalDate from, LocalDate to);

    List<CalendarEvent> findByPlatformIdIsNullAndEventDateBetween(LocalDate from, LocalDate to);
}
