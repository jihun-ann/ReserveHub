package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.calendar.CalendarEvent;
import com.hub.reservehub.domain.calendar.CalendarEventService;
import com.hub.reservehub.domain.calendar.EventType;
import com.hub.reservehub.domain.calendar.ShareScope;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
public class CalendarEventController {

    private final CalendarEventService calendarEventService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public CalendarEventController(CalendarEventService calendarEventService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.calendarEventService = calendarEventService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/calendar-events")
    // platformId omitted means a company-wide (전사) event; only OWNER may create one (checked in the service).
    // platformId를 생략하면 전사 이벤트를 의미하며, OWNER만 생성할 수 있다 (서비스에서 검증).
    public ResponseEntity<CalendarEventResponse> create(@Valid @RequestBody CreateCalendarEventRequest request) {
        CalendarEvent event = calendarEventService.create(
                request.platformId(), currentAuthenticatedUser.get(), request.type(), request.title(),
                request.description(), request.eventDate(), request.eventEndDate(), request.allDay(), request.shareScope()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(CalendarEventResponse.from(event));
    }

    @GetMapping("/api/v1/platforms/{platformId}/calendar-events")
    public List<CalendarEventResponse> list(
            @PathVariable UUID platformId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return calendarEventService.list(platformId, currentAuthenticatedUser.get(), from, to).stream()
                .map(CalendarEventResponse::from)
                .toList();
    }

    public record CreateCalendarEventRequest(
            UUID platformId,
            @NotNull EventType type,
            @NotBlank String title,
            String description,
            @NotNull LocalDate eventDate,
            LocalDate eventEndDate,
            boolean allDay,
            ShareScope shareScope
    ) {
        public CreateCalendarEventRequest {
            if (shareScope == null) {
                shareScope = ShareScope.PLATFORM;
            }
        }
    }

    public record CalendarEventResponse(
            UUID id, UUID platformId, EventType type, String title, String description,
            LocalDate eventDate, LocalDate eventEndDate, boolean allDay, ShareScope shareScope
    ) {
        public static CalendarEventResponse from(CalendarEvent event) {
            return new CalendarEventResponse(
                    event.getId(), event.getPlatformId(), event.getType(), event.getTitle(), event.getDescription(),
                    event.getEventDate(), event.getEventEndDate(), event.isAllDay(), event.getShareScope()
            );
        }
    }
}
