package com.hub.reservehub.domain.calendar;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public CalendarEventService(CalendarEventRepository calendarEventRepository, PlatformAccessGuard platformAccessGuard) {
        this.calendarEventRepository = calendarEventRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    // HQ_NOTICE and company-wide (platformId == null) events are OWNER-only; anything else needs
    // staff access to that specific platform (AGENT.md event_type comment, section 3/4-1).
    // HQ_NOTICE와 전사(platformId == null) 이벤트는 OWNER만 가능하며, 그 외에는 해당 플랫폼 스태프 권한이 필요하다.
    public CalendarEvent create(
            @Nullable UUID platformId, AuthenticatedUser actor, EventType type, String title,
            @Nullable String description, LocalDate eventDate, @Nullable LocalDate eventEndDate,
            boolean allDay, ShareScope shareScope
    ) {
        if (type == EventType.HQ_NOTICE && actor.getRole() != Role.OWNER) {
            throw new IllegalStateException("Only OWNER can create HQ_NOTICE events");
        }
        if (platformId != null) {
            platformAccessGuard.verify(platformId, actor);
        } else if (actor.getRole() != Role.OWNER) {
            throw new IllegalStateException("Only OWNER can create company-wide events");
        }

        return calendarEventRepository.save(new CalendarEvent(
                platformId, type, title, description, eventDate, eventEndDate, allDay, shareScope, actor.getId()
        ));
    }

    @Transactional(readOnly = true)
    // Merges the platform's own events with company-wide (HQ) events for the same date range.
    // 플랫폼 고유 이벤트와 전사(HQ) 이벤트를 같은 기간 기준으로 합쳐서 반환한다.
    public List<CalendarEvent> list(UUID platformId, AuthenticatedUser actor, LocalDate from, LocalDate to) {
        platformAccessGuard.verify(platformId, actor);
        List<CalendarEvent> events = new ArrayList<>(calendarEventRepository.findByPlatformIdAndEventDateBetween(platformId, from, to));
        events.addAll(calendarEventRepository.findByPlatformIdIsNullAndEventDateBetween(from, to));
        return events;
    }
}
