package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "platforms")
public class Platform extends BaseEntity {

    // 캘린더/사이드바에서 플랫폼을 색으로 구분하므로, 생성 순서대로 이 팔레트를 한 바퀴씩 돌며
    // 배정한다 (전부 같은 기본색이면 여러 플랫폼을 눈으로 구분할 수 없다).
    private static final List<String> COLOR_PALETTE = List.of(
            "#7c6af7", "#4fd1c5", "#f6ad55", "#f56565", "#48bb78", "#4299e1", "#ed64a6", "#ecc94b",
            "#9f7aea", "#38b2ac", "#ed8936", "#e53e3e", "#38a169", "#3182ce", "#d53f8c", "#d69e2e",
            "#667eea", "#319795", "#dd6b20", "#805ad5"
    );
    private static final AtomicInteger COLOR_INDEX = new AtomicInteger(0);

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessType businessType;

    @Nullable
    private String phone;

    @Nullable
    private String address;

    @Nullable
    private String description;

    @Column(nullable = false)
    private String emoji = "🏢";

    @Column(nullable = false)
    private String colorHex = "#7c6af7";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlatformStatus status = PlatformStatus.ACTIVE;

    @Column(nullable = false)
    private UUID createdBy;

    protected Platform() {
        // JPA only.
    }

    public Platform(String name, BusinessType businessType, @Nullable String phone,
                     @Nullable String address, @Nullable String description, UUID createdBy) {
        this.name = name;
        this.businessType = businessType;
        this.phone = phone;
        this.address = address;
        this.description = description;
        this.createdBy = createdBy;
        this.colorHex = COLOR_PALETTE.get(COLOR_INDEX.getAndIncrement() % COLOR_PALETTE.size());
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BusinessType getBusinessType() {
        return businessType;
    }

    @Nullable
    public String getPhone() {
        return phone;
    }

    @Nullable
    public String getAddress() {
        return address;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    public String getEmoji() {
        return emoji;
    }

    public String getColorHex() {
        return colorHex;
    }

    public PlatformStatus getStatus() {
        return status;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void suspend() {
        this.status = PlatformStatus.SUSPENDED;
    }

    public void activate() {
        this.status = PlatformStatus.ACTIVE;
    }
}
