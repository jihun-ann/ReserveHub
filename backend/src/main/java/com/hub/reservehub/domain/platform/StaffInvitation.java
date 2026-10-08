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
 * 오너/상위 매니저가 보낸 강사·매니저 초대. 초대받은 사람이 링크(token)로 들어와 로그인한 뒤, 계정의
 * 이메일 또는 연락처가 초대에 적힌 값과 일치할 때 수락해야 PlatformStaff로 배정된다.
 */
@Entity
@Table(name = "staff_invitations")
public class StaffInvitation {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole staffRole;

    // MANAGER 초대에서만 의미를 가진다.
    @Nullable
    @Enumerated(EnumType.STRING)
    private ManagerTier managerTier;

    // 이메일/연락처 중 최소 하나. 연락처는 숫자만 남긴 형태로 저장한다.
    @Nullable
    private String email;

    @Nullable
    private String phone;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private UUID createdBy;

    @Column(nullable = false)
    private Instant createdAt;

    protected StaffInvitation() {
        // JPA only.
    }

    public StaffInvitation(
            UUID platformId, StaffRole staffRole, @Nullable ManagerTier managerTier,
            @Nullable String email, @Nullable String phone, UUID createdBy, Instant expiresAt
    ) {
        this.platformId = platformId;
        this.staffRole = staffRole;
        this.managerTier = managerTier;
        this.email = email;
        this.phone = phone;
        this.createdBy = createdBy;
        this.token = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public StaffRole getStaffRole() {
        return staffRole;
    }

    @Nullable
    public ManagerTier getManagerTier() {
        return managerTier;
    }

    @Nullable
    public String getEmail() {
        return email;
    }

    @Nullable
    public String getPhone() {
        return phone;
    }

    public String getToken() {
        return token;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }

    public void cancel() {
        this.status = InvitationStatus.CANCELLED;
    }
}
