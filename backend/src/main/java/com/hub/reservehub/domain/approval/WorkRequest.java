package com.hub.reservehub.domain.approval;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 업무 요청 — 플랫폼의 오너·매니저·세무사가 서로(또는 자기 자신에게) 맡기는 일. 요청자가 담당자를 정하고,
 * 담당자가 댓글·첨부로 주고받으며 진행 중 → 완료로 넘긴다. 요청자는 끝나기 전에 취소할 수 있다.
 * 요청자 = 담당자면 개인 할 일(대시보드의 "처리 대기 업무"에서 직접 추가)이 된다.
 */
@Entity
@Table(name = "work_requests")
public class WorkRequest extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private UUID requestedBy;

    @Column(nullable = false)
    private UUID assigneeId;

    @Column(nullable = false)
    private String title;

    @Nullable
    private String memo;

    @Nullable
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkRequestStatus status = WorkRequestStatus.REQUESTED;

    // 담당자가 처음 열어 본 시각 — 추가 확인 요청을 받으면 다시 비운다.
    @Nullable
    private Instant readAt;

    // 요청자가 긴급으로 표시 — 담당자 목록 맨 위(긴급끼리는 등록 순).
    @Column(nullable = false)
    private boolean urgent;

    // 담당자가 화살표로 정한 순서. 아직 안 정했으면 null(맨 뒤, 등록 순).
    @Nullable
    private Integer sortOrder;

    protected WorkRequest() {
        // JPA only.
    }

    public WorkRequest(
            UUID platformId, UUID requestedBy, UUID assigneeId,
            String title, @Nullable String memo, @Nullable LocalDate dueDate
    ) {
        this.platformId = platformId;
        this.requestedBy = requestedBy;
        this.assigneeId = assigneeId;
        this.title = title;
        this.memo = memo;
        this.dueDate = dueDate;
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

    public UUID getAssigneeId() {
        return assigneeId;
    }

    public String getTitle() {
        return title;
    }

    @Nullable
    public String getMemo() {
        return memo;
    }

    @Nullable
    public LocalDate getDueDate() {
        return dueDate;
    }

    public WorkRequestStatus getStatus() {
        return status;
    }

    @Nullable
    public Instant getReadAt() {
        return readAt;
    }

    public boolean isUrgent() {
        return urgent;
    }

    public void markUrgent() {
        if (!isOpen()) {
            throw new IllegalStateException("이미 끝난 업무 요청입니다.");
        }
        urgent = true;
    }

    @Nullable
    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    // 처음 확인했을 때만 true — 이미 확인한 요청은 시각을 덮어쓰지 않는다.
    public boolean markRead() {
        if (readAt != null) {
            return false;
        }
        readAt = Instant.now();
        return true;
    }

    public boolean isOpen() {
        return status == WorkRequestStatus.REQUESTED || status == WorkRequestStatus.IN_PROGRESS
                || status == WorkRequestStatus.REVISION_REQUESTED;
    }

    // 완료된 일을 요청자가 다시 확인해 달라고 돌려보낸다 — 담당자가 다시 봐야 하므로 확인 시각도 비운다.
    public void requestRevision() {
        if (status != WorkRequestStatus.DONE) {
            throw new IllegalStateException("완료된 업무만 추가 확인을 요청할 수 있습니다.");
        }
        status = WorkRequestStatus.REVISION_REQUESTED;
        readAt = null;
    }

    public void changeStatus(WorkRequestStatus next) {
        if (!isOpen()) {
            throw new IllegalStateException("이미 끝난 업무 요청입니다.");
        }
        this.status = next;
    }
}
