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

/**
 * 스태프(강사/매니저 등)가 제출하는 휴가 요청 — ScheduleChangeRequest와 같은
 * PENDING/APPROVED/REJECTED 구조를 그대로 따르되, 특정 예약에 매이지 않고 날짜 범위만 갖는다.
 * 매니저 또는 오너가 승인/반려한다.
 */
@Entity
@Table(name = "leave_requests")
public class LeaveRequest extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    // 요청을 제출한 스태프.
    @Column(nullable = false)
    private UUID requestedBy;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Nullable
    private String reason;

    // 시간 단위 휴가면 쓰는 시간(1~7, 하루짜리만). null이면 종일(연차).
    @Nullable
    private Integer hours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Nullable
    private String decisionMemo;

    // 승인/반려를 처리한 매니저/오너. PENDING인 동안은 null.
    @Nullable
    private UUID decidedBy;

    protected LeaveRequest() {
        // JPA only.
    }

    public LeaveRequest(
            UUID platformId, UUID requestedBy, LocalDate startDate, LocalDate endDate, @Nullable Integer hours, @Nullable String reason
    ) {
        this.platformId = platformId;
        this.requestedBy = requestedBy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.hours = hours;
        this.reason = reason;
    }

    @Nullable
    public Integer getHours() {
        return hours;
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

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
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
