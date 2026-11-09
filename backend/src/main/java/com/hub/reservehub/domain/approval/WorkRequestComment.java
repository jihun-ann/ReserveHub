package com.hub.reservehub.domain.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 업무 요청(WorkRequest)에 대한 댓글 — 오너·매니저·세무사가 계속 이어서 남길 수 있고,
 * 텍스트 없이 파일만 첨부할 수도 있다 (content/첨부 중 최소 하나는 있어야 함, 서비스에서 검증).
 */
@Entity
@Table(name = "work_request_comments")
public class WorkRequestComment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID requestId;

    @Column(nullable = false)
    private UUID authorId;

    @Nullable
    private String content;

    @Nullable
    private String attachmentOriginalName;

    @Nullable
    private String attachmentStoredPath;

    @Nullable
    private String attachmentContentType;

    @Nullable
    private Long attachmentSizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected WorkRequestComment() {
        // JPA only.
    }

    public WorkRequestComment(UUID requestId, UUID authorId, @Nullable String content) {
        this.requestId = requestId;
        this.authorId = authorId;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public static WorkRequestComment withAttachment(
            UUID requestId, UUID authorId, @Nullable String content, String attachmentOriginalName,
            String attachmentStoredPath, @Nullable String attachmentContentType, long attachmentSizeBytes
    ) {
        WorkRequestComment comment = new WorkRequestComment(requestId, authorId, content);
        comment.attachmentOriginalName = attachmentOriginalName;
        comment.attachmentStoredPath = attachmentStoredPath;
        comment.attachmentContentType = attachmentContentType;
        comment.attachmentSizeBytes = attachmentSizeBytes;
        return comment;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    @Nullable
    public String getContent() {
        return content;
    }

    @Nullable
    public String getAttachmentOriginalName() {
        return attachmentOriginalName;
    }

    @Nullable
    public String getAttachmentStoredPath() {
        return attachmentStoredPath;
    }

    @Nullable
    public String getAttachmentContentType() {
        return attachmentContentType;
    }

    @Nullable
    public Long getAttachmentSizeBytes() {
        return attachmentSizeBytes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
