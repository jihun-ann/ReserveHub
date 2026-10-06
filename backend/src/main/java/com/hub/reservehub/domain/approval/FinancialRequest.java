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
 * 세무사가 플랫폼의 재무 일정(월급날/지출일/명세서 제출일)을 등록하면 그 플랫폼의 매니저(또는 오너)가
 * 승인/반려하는 요청 — ScheduleChangeRequest와 같은 PENDING/APPROVED/REJECTED 구조를 그대로 따른다.
 * 승인된 요청은 세무사와 매니저 양쪽 캘린더에 재무 일정으로 남는다.
 */
@Entity
@Table(name = "financial_requests")
public class FinancialRequest extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    // 요청을 등록한 세무사(TAX_ACCOUNTANT).
    @Column(nullable = false)
    private UUID requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinancialRequestType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Nullable
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Nullable
    private String decisionMemo;

    protected FinancialRequest() {
        // JPA only.
    }

    public FinancialRequest(
            UUID platformId, UUID requestedBy, FinancialRequestType type,
            String title, LocalDate eventDate, @Nullable String memo
    ) {
        this.platformId = platformId;
        this.requestedBy = requestedBy;
        this.type = type;
        this.title = title;
        this.eventDate = eventDate;
        this.memo = memo;
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

    public FinancialRequestType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    public RequestStatus getStatus() {
        return status;
    }

    @Nullable
    public String getDecisionMemo() {
        return decisionMemo;
    }

    public void approve(@Nullable String decisionMemo) {
        if (status != RequestStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING request can be approved");
        }
        this.status = RequestStatus.APPROVED;
        this.decisionMemo = decisionMemo;
    }

    public void reject(@Nullable String decisionMemo) {
        if (status != RequestStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING request can be rejected");
        }
        this.status = RequestStatus.REJECTED;
        this.decisionMemo = decisionMemo;
    }
}
