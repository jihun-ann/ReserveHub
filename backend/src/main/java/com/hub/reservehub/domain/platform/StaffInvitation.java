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
 * 오너/상위 매니저가 보낸 강사·매니저·회원 초대. 초대받은 사람이 링크(token)로 들어와 로그인한 뒤, 계정의
 * 이메일 또는 연락처가 초대에 적힌 값과 일치할 때 수락한다. 강사·매니저는 PlatformStaff로 배정되고,
 * 회원(staffRole == null)은 승인된 가입 신청이 되어 센터의 "수강권 등록 대기" 목록에 올라간다.
 */
@Entity
@Table(name = "staff_invitations")
public class StaffInvitation {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    // null이면 회원 초대
    @Nullable
    @Enumerated(EnumType.STRING)
    private StaffRole staffRole;

    // MANAGER 초대에서만 의미를 가진다.
    @Nullable
    @Enumerated(EnumType.STRING)
    private ManagerTier managerTier;

    // MANAGER 초대에서만 의미 — 수락 시 이 그룹에 배정한다. 그룹이 지워지면 DB가 NULL로 되돌린다.
    @Nullable
    private UUID managerGroupId;

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
            UUID platformId, @Nullable StaffRole staffRole, @Nullable ManagerTier managerTier, @Nullable UUID managerGroupId,
            @Nullable String email, @Nullable String phone, UUID createdBy, Instant expiresAt
    ) {
        this.platformId = platformId;
        this.staffRole = staffRole;
        this.managerTier = managerTier;
        this.managerGroupId = managerGroupId;
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

    @Nullable
    public StaffRole getStaffRole() {
        return staffRole;
    }

    public boolean isMemberInvite() {
        return staffRole == null;
    }

    @Nullable
    public ManagerTier getManagerTier() {
        return managerTier;
    }

    @Nullable
    public UUID getManagerGroupId() {
        return managerGroupId;
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
