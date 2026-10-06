package com.hub.reservehub.domain.facility;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.LocalTime;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 플랫폼이 보유한 예약 가능 시설물 (예: "2층 연습실", "3층 연습실"). 오너가 등록/폐쇄하며,
 * 사용자는 이 시설물을 날짜+시간대로 예약(FacilityBooking)하고, 고장 시 신고(FacilityIssue)한다.
 */
@Entity
@Table(name = "facilities")
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

    // 자유 입력 층 표기 (예: "1층", "지하1층"). 배치도를 층별로 나눠 보여주는 데도 쓰인다.
    @Nullable
    private String floor;

    @Column(nullable = false)
    private boolean isActive = true;

    // 동시 이용 가능 인원(정원). 같은 시간대에 이 인원수만큼 겹치는 예약이 허용된다 — 1이면 독점 예약(기존 방식)과 동일.
    @Column(nullable = false)
    private int capacity = 1;

    // 배치도 상의 위치 (0~100 백분율). 둘 다 null이면 아직 배치되지 않은 시설물.
    // 명시적 컬럼명 필요 — Hibernate 기본 네이밍 전략은 끝자리 단일 대문자(X/Y) 앞에 밑줄을 안 넣어서
    // "posx"/"posy"로 찾다가 schema.sql의 pos_x/pos_y와 어긋난다.
    @Nullable
    @Column(name = "pos_x")
    private Integer posX;

    @Nullable
    @Column(name = "pos_y")
    private Integer posY;

    // 하루 중 예약 가능한 시간대. 둘 다 null이면 시간 제한 없음(종일 예약 가능).
    @Nullable
    private LocalTime openTime;

    @Nullable
    private LocalTime closeTime;

    protected Facility() {
        // JPA only.
    }

    public Facility(
            UUID platformId, String name, @Nullable String description, @Nullable String floor,
            int capacity, @Nullable LocalTime openTime, @Nullable LocalTime closeTime
    ) {
        this.platformId = platformId;
        this.name = name;
        this.description = description;
        this.floor = floor;
        this.capacity = capacity;
        this.openTime = openTime;
        this.closeTime = closeTime;
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

    @Nullable
    public String getFloor() {
        return floor;
    }

    public boolean isActive() {
        return isActive;
    }

    public int getCapacity() {
        return capacity;
    }

    @Nullable
    public Integer getPosX() {
        return posX;
    }

    @Nullable
    public Integer getPosY() {
        return posY;
    }

    @Nullable
    public LocalTime getOpenTime() {
        return openTime;
    }

    @Nullable
    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void update(
            String name, @Nullable String description, @Nullable String floor,
            int capacity, @Nullable LocalTime openTime, @Nullable LocalTime closeTime
    ) {
        this.name = name;
        this.description = description;
        this.floor = floor;
        this.capacity = capacity;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    public void updatePosition(int posX, int posY) {
        this.posX = posX;
        this.posY = posY;
    }

    // Soft delete — keeps history for existing bookings/issues (AGENT.md 4-4).
    public void deactivate() {
        this.isActive = false;
    }
}
