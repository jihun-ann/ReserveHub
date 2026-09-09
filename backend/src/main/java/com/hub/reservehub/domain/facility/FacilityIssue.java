package com.hub.reservehub.domain.facility;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 시설물 고장/이상 신고 — 사용자·강사·매니저·오너 누구나 등록할 수 있고, 매니저 이상만 상태를
 * 변경(보수 중/완료 처리)할 수 있다.
 */
@Entity
public class FacilityIssue {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID facilityId;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID reportedBy;

    @Lob
    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityIssueStatus status = FacilityIssueStatus.OPEN;

    @Nullable
    private UUID resolvedBy;

    @Nullable
    private Instant resolvedAt;

    @Nullable
    private String resolutionMemo;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected FacilityIssue() {
        // JPA only.
    }

    public FacilityIssue(UUID facilityId, UUID platformId, UUID reportedBy, String description) {
        this.facilityId = facilityId;
        this.platformId = platformId;
        this.reportedBy = reportedBy;
        this.description = description;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getFacilityId() {
        return facilityId;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getReportedBy() {
        return reportedBy;
    }

    public String getDescription() {
        return description;
    }

    public FacilityIssueStatus getStatus() {
        return status;
    }

    @Nullable
    public UUID getResolvedBy() {
        return resolvedBy;
    }

    @Nullable
    public Instant getResolvedAt() {
        return resolvedAt;
    }

    @Nullable
    public String getResolutionMemo() {
        return resolutionMemo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void markInProgress() {
        if (status == FacilityIssueStatus.RESOLVED) {
            throw new IllegalStateException("Already resolved");
        }
        this.status = FacilityIssueStatus.IN_PROGRESS;
    }

    public void resolve(UUID resolvedBy, @Nullable String resolutionMemo) {
        this.status = FacilityIssueStatus.RESOLVED;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = Instant.now();
        this.resolutionMemo = resolutionMemo;
    }
}
