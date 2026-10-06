package com.hub.reservehub.domain.calendar;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "calendar_events")
public class CalendarEvent extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    // NULL means company-wide (전사), not scoped to any one platform.
    // NULL이면 전 플랫폼 공통(전사) 이벤트.
    @Nullable
    private UUID platformId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    @Column(nullable = false)
    private String title;

    @Nullable
    private String description;

    @Column(nullable = false)
    private LocalDate eventDate;

    // NULL means a single-day event.
    // NULL이면 단일 일정.
    @Nullable
    private LocalDate eventEndDate;

    @Column(nullable = false)
    private boolean allDay = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShareScope shareScope = ShareScope.PLATFORM;

    @Column(nullable = false)
    private UUID createdBy;

    protected CalendarEvent() {
        // JPA only.
    }

    public CalendarEvent(
            @Nullable UUID platformId, EventType type, String title, @Nullable String description,
            LocalDate eventDate, @Nullable LocalDate eventEndDate, boolean allDay, ShareScope shareScope, UUID createdBy
    ) {
        if (eventEndDate != null && eventEndDate.isBefore(eventDate)) {
            throw new IllegalArgumentException("eventEndDate must not be before eventDate");
        }
        this.platformId = platformId;
        this.type = type;
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.eventEndDate = eventEndDate;
        this.allDay = allDay;
        this.shareScope = shareScope;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    @Nullable
    public UUID getPlatformId() {
        return platformId;
    }

    public EventType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    @Nullable
    public LocalDate getEventEndDate() {
        return eventEndDate;
    }

    public boolean isAllDay() {
        return allDay;
    }

    public ShareScope getShareScope() {
        return shareScope;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }
}
