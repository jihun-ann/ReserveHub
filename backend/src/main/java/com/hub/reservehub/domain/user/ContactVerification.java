package com.hub.reservehub.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * 이메일/연락처 인증 코드 한 건 — 코드는 해시로만 저장하고, 유효시간과 시도 횟수를 둔다.
 * target은 코드를 보낸 시점의 이메일/연락처라서, 이후 값이 바뀌면 이 코드로는 인증되지 않는다.
 */
@Entity
@Table(name = "contact_verifications")
public class ContactVerification {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationChannel channel;

    @Column(nullable = false)
    private String target;

    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ContactVerification() {
        // JPA only.
    }

    public ContactVerification(UUID userId, VerificationChannel channel, String target, String codeHash, Instant expiresAt) {
        this.userId = userId;
        this.channel = channel;
        this.target = target;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public String getTarget() {
        return target;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public int getAttempts() {
        return attempts;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void recordAttempt() {
        this.attempts++;
    }
}
