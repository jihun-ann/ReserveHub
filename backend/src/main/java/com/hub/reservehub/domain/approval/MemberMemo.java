package com.hub.reservehub.domain.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "member_memos")
public class MemberMemo {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    // The member (student) this memo is about.
    // 메모 대상 수강생.
    @Column(nullable = false)
    private UUID userId;

    // The staff member who wrote it.
    // 작성한 스태프.
    @Column(nullable = false)
    private UUID authorId;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected MemberMemo() {
        // JPA only.
    }

    public MemberMemo(UUID platformId, UUID userId, UUID authorId, String content) {
        this.platformId = platformId;
        this.userId = userId;
        this.authorId = authorId;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
