package com.hub.reservehub.domain.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * Platform opening application — anyone signed in submits it with a business registration certificate;
 * a service ADMIN approves it, and only then is the real Platform row created.
 * 플랫폼 개설 신청 — 로그인한 누구나 사업자등록증을 첨부해 신청하고, 서비스 운영자(ADMIN)가 승인해야
 * 실제 Platform이 만들어진다. 심사 전엔 Platform이 없으니 소유권 기반 권한이 신청자에게 열리지 않는다.
 */
@Entity
@Table(name = "platform_applications")
public class PlatformApplication {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID applicantId;

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

    // 숫자 10자리(하이픈 없음) — BusinessNumber.normalize로 정리·검증된 값만 들어온다.
    @Column(nullable = false, length = 10)
    private String businessNumber;

    @Column(nullable = false)
    private String certificateOriginalName;

    @Column(nullable = false)
    private String certificateStoredPath;

    @Nullable
    private String certificateContentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlatformApplicationStatus status = PlatformApplicationStatus.PENDING;

    @Nullable
    private UUID decidedBy;

    @Nullable
    private String decisionMemo;

    // 승인으로 만들어진 플랫폼
    @Nullable
    private UUID platformId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Nullable
    private Instant decidedAt;

    protected PlatformApplication() {
        // JPA only.
    }

    public PlatformApplication(
            UUID applicantId, String name, BusinessType businessType, @Nullable String phone, @Nullable String address,
            @Nullable String description, String businessNumber,
            String certificateOriginalName, String certificateStoredPath, @Nullable String certificateContentType
    ) {
        this.applicantId = applicantId;
        this.name = name;
        this.businessType = businessType;
        this.phone = phone;
        this.address = address;
        this.description = description;
        this.businessNumber = businessNumber;
        this.certificateOriginalName = certificateOriginalName;
        this.certificateStoredPath = certificateStoredPath;
        this.certificateContentType = certificateContentType;
    }

    public UUID getId() {
        return id;
    }

    public UUID getApplicantId() {
        return applicantId;
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

    public String getBusinessNumber() {
        return businessNumber;
    }

    public String getCertificateOriginalName() {
        return certificateOriginalName;
    }

    public String getCertificateStoredPath() {
        return certificateStoredPath;
    }

    @Nullable
    public String getCertificateContentType() {
        return certificateContentType;
    }

    public PlatformApplicationStatus getStatus() {
        return status;
    }

    @Nullable
    public UUID getDecidedBy() {
        return decidedBy;
    }

    @Nullable
    public String getDecisionMemo() {
        return decisionMemo;
    }

    @Nullable
    public UUID getPlatformId() {
        return platformId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Nullable
    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void approve(UUID adminId, @Nullable String memo, UUID createdPlatformId) {
        decide(PlatformApplicationStatus.APPROVED, adminId, memo);
        this.platformId = createdPlatformId;
    }

    public void reject(UUID adminId, String memo) {
        decide(PlatformApplicationStatus.REJECTED, adminId, memo);
    }

    public void cancel() {
        requirePending();
        this.status = PlatformApplicationStatus.CANCELLED;
        this.decidedAt = Instant.now();
    }

    private void decide(PlatformApplicationStatus next, UUID adminId, @Nullable String memo) {
        requirePending();
        this.status = next;
        this.decidedBy = adminId;
        this.decisionMemo = memo;
        this.decidedAt = Instant.now();
    }

    private void requirePending() {
        if (status != PlatformApplicationStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 신청입니다.");
        }
    }
}
