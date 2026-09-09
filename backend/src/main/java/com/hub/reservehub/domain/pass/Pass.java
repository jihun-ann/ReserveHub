package com.hub.reservehub.domain.pass;

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
public class Pass extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PassType type;

    @Column(nullable = false)
    private int price;

    // Only meaningful for SESSION-type passes; NULL otherwise (MONTHLY/DAILY/CUSTOM).
    // SESSION 타입에서만 사용하며, 그 외 타입은 NULL이다.
    @Nullable
    private Short sessionCount;

    @Column(nullable = false)
    private short validDays = 30;

    @Column(nullable = false)
    private boolean isActive = true;

    protected Pass() {
        // JPA only.
    }

    public Pass(UUID platformId, String name, PassType type, int price, @Nullable Short sessionCount, short validDays) {
        if (price < 0) {
            throw new IllegalArgumentException("price must not be negative");
        }
        if (validDays <= 0) {
            throw new IllegalArgumentException("validDays must be positive");
        }
        this.platformId = platformId;
        this.name = name;
        this.type = type;
        this.price = price;
        this.sessionCount = sessionCount;
        this.validDays = validDays;
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

    public PassType getType() {
        return type;
    }

    public int getPrice() {
        return price;
    }

    @Nullable
    public Short getSessionCount() {
        return sessionCount;
    }

    public short getValidDays() {
        return validDays;
    }

    public boolean isActive() {
        return isActive;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void update(String name, PassType type, int price, @Nullable Short sessionCount, short validDays) {
        if (price < 0) {
            throw new IllegalArgumentException("price must not be negative");
        }
        if (validDays <= 0) {
            throw new IllegalArgumentException("validDays must be positive");
        }
        this.name = name;
        this.type = type;
        this.price = price;
        this.sessionCount = sessionCount;
        this.validDays = validDays;
    }
}
