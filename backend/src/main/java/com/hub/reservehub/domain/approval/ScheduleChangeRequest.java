package com.hub.reservehub.domain.approval;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "schedule_change_requests")
public class ScheduleChangeRequest extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    // The tutor (TUTOR) who submitted the request.
    // 요청을 제출한 강사(TUTOR).
    @Column(nullable = false)
    private UUID requestedBy;

    @Column(nullable = false)
    private UUID reservationId;

    @Column(nullable = false)
    private LocalDate originalDate;

    @Column(nullable = false)
    private UUID originalSlot;

    @Column(nullable = false)
    private LocalDate requestedDate;

    // NULL means a one-off time outside the regular slot schedule.
    // NULL이면 정기 슬롯 외의 시간을 의미한다.
    @Nullable
    private UUID requestedSlot;

    @Nullable
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    // 승인/반려 시 처리자가 남긴 메모. 반려 사유를 요청자에게 보여주기 위해 요청 자체에 저장한다.
    @Nullable
    private String decisionMemo;

    // 승인/반려를 처리한 매니저/오너. PENDING인 동안은 null.
    @Nullable
    private UUID decidedBy;

    protected ScheduleChangeRequest() {
        // JPA only.
    }

    public ScheduleChangeRequest(
            UUID platformId, UUID requestedBy, UUID reservationId, LocalDate originalDate,
            UUID originalSlot, LocalDate requestedDate, @Nullable UUID requestedSlot, @Nullable String reason
    ) {
        this.platformId = platformId;
        this.requestedBy = requestedBy;
        this.reservationId = reservationId;
        this.originalDate = originalDate;
        this.originalSlot = originalSlot;
        this.requestedDate = requestedDate;
        this.requestedSlot = requestedSlot;
        this.reason = reason;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getRequestedBy() {
        return requestedBy;
    }

    public UUID getReservationId() {
        return reservationId;
    }

    public LocalDate getOriginalDate() {
        return originalDate;
    }

    public UUID getOriginalSlot() {
        return originalSlot;
    }

    public LocalDate getRequestedDate() {
        return requestedDate;
    }

    @Nullable
    public UUID getRequestedSlot() {
        return requestedSlot;
    }

    @Nullable
    public String getReason() {
        return reason;
    }

    public RequestStatus getStatus() {
        return status;
    }

    @Nullable
    public String getDecisionMemo() {
        return decisionMemo;
    }

    @Nullable
    public UUID getDecidedBy() {
        return decidedBy;
    }

    public void approve(UUID decidedBy, @Nullable String memo) {
        if (status != RequestStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING request can be approved");
        }
        this.status = RequestStatus.APPROVED;
        this.decisionMemo = memo;
        this.decidedBy = decidedBy;
    }

    public void reject(UUID decidedBy, @Nullable String memo) {
        if (status != RequestStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING request can be rejected");
        }
        this.status = RequestStatus.REJECTED;
        this.decisionMemo = memo;
        this.decidedBy = decidedBy;
    }
}
