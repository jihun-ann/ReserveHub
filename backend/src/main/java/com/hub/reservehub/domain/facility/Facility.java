package com.hub.reservehub.domain.facility;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 플랫폼이 보유한 예약 가능 시설물 (예: "2층 연습실", "3층 연습실"). 오너가 등록/폐쇄하며,
 * 사용자는 이 시설물을 날짜+시간대로 예약(FacilityBooking)하고, 고장 시 신고(FacilityIssue)한다.
 */
@Entity
public class Facility extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private String name;

    @Nullable
    private String description;

    @Column(nullable = false)
    private boolean isActive = true;

    protected Facility() {
        // JPA only.
    }

    public Facility(UUID platformId, String name, @Nullable String description) {
        this.platformId = platformId;
        this.name = name;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public String getName() {
        return name;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return isActive;
    }

    public void update(String name, @Nullable String description) {
        this.name = name;
        this.description = description;
    }

    // Soft delete — keeps history for existing bookings/issues (AGENT.md 4-4).
    public void deactivate() {
        this.isActive = false;
    }
}
