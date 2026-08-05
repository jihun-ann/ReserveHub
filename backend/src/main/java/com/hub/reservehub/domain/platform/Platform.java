package com.hub.reservehub.domain.platform;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class Platform extends BaseEntity {

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
