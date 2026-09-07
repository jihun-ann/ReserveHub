package com.hub.reservehub.domain.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.springframework.lang.Nullable;

/**
 * 재무 요청(FinancialRequest)에 대한 댓글 — 세무사·매니저·오너가 계속 이어서 남길 수 있고,
 * 텍스트 없이 파일만 첨부할 수도 있다 (content/첨부 중 최소 하나는 있어야 함, 서비스에서 검증).
 */
@Entity
public class FinancialRequestComment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID requestId;

    @Column(nullable = false)
    private UUID authorId;

    @Nullable
    @Column(columnDefinition = "TEXT")
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

    protected FinancialRequestComment() {
        // JPA only.
    }

    public FinancialRequestComment(UUID requestId, UUID authorId, @Nullable String content) {
        this.requestId = requestId;
        this.authorId = authorId;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public static FinancialRequestComment withAttachment(
            UUID requestId, UUID authorId, @Nullable String content, String attachmentOriginalName,
            String attachmentStoredPath, @Nullable String attachmentContentType, long attachmentSizeBytes
    ) {
        FinancialRequestComment comment = new FinancialRequestComment(requestId, authorId, content);
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
