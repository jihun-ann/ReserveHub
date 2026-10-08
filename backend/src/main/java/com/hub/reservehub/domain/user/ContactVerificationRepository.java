package com.hub.reservehub.domain.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactVerificationRepository extends JpaRepository<ContactVerification, UUID> {
    Optional<ContactVerification> findFirstByUserIdAndChannelOrderByCreatedAtDesc(UUID userId, VerificationChannel channel);

    void deleteByUserIdAndChannel(UUID userId, VerificationChannel channel);
}
