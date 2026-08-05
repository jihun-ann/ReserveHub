package com.hub.reservehub.domain.pass;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class DiscountPolicy extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType type;

    @Column(nullable = false)
    private BigDecimal rate;

    // LONG_TERM: minimum months, FAMILY: minimum member count; NULL for other types.
    // LONG_TERM은 최소 개월수, FAMILY는 최소 인원수. 그 외 타입은 NULL.
    @Nullable
    private Integer conditionValue;

    @Nullable
    @Column(unique = true)
    private String couponCode;

    @Nullable
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean isActive = true;

    @Nullable
    private String memo;

    @Column(nullable = false)
    private UUID createdBy;

    protected DiscountPolicy() {
        // JPA only.
    }

    public DiscountPolicy(
            UUID platformId, String name, DiscountType type, BigDecimal rate,
            @Nullable Integer conditionValue, @Nullable String couponCode,
            @Nullable Instant expiresAt, @Nullable String memo, UUID createdBy
    ) {
        if (rate.signum() <= 0 || rate.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("rate must be between 0 (exclusive) and 100");
        }
        this.platformId = platformId;
        this.name = name;
        this.type = type;
        this.rate = rate;
        this.conditionValue = conditionValue;
        this.couponCode = couponCode;
        this.expiresAt = expiresAt;
        this.memo = memo;
        this.createdBy = createdBy;
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

    public DiscountType getType() {
        return type;
    }

    public BigDecimal getRate() {
        return rate;
    }

    @Nullable
    public Integer getConditionValue() {
        return conditionValue;
    }

    @Nullable
    public String getCouponCode() {
        return couponCode;
    }

    @Nullable
    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isActive() {
        return isActive;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public boolean isUsableNow() {
        return isActive && (expiresAt == null || expiresAt.isAfter(Instant.now()));
    }

    public void deactivate() {
        this.isActive = false;
    }
}
