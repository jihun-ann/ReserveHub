package com.hub.reservehub.domain.program;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/**
 * 고정 배정 로스터 — 고정형(PRIVATE, 또는 GROUP+FIXED) 슬롯에 미리 등록해두는 수강생 목록.
 * 신청형(GROUP+APPLICATION) 슬롯은 이 테이블을 쓰지 않고 매주 Reservation을 직접 신청한다.
 * 등록되어 있으면 Lesson이 생성될 때마다 이 사람 몫의 Reservation이 자동 생성된다(신청 불필요).
 */
@Entity
@Table(name = "slot_members")
public class SlotMember {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID slotId;

    @Column(nullable = false)
    private UUID userId;

    // 이 고정 배정이 소비할 수강권 — 로스터에 넣을 때 담당자가 지정한다.
    @Column(nullable = false)
    private UUID userPassId;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected SlotMember() {
        // JPA only.
    }

    public SlotMember(UUID slotId, UUID userId, UUID userPassId) {
        this.slotId = slotId;
        this.userId = userId;
        this.userPassId = userPassId;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getSlotId() {
        return slotId;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getUserPassId() {
        return userPassId;
    }

    public boolean isActive() {
        return isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void remove() {
        this.isActive = false;
    }
}
