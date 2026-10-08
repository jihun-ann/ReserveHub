package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffInvitationRepository extends JpaRepository<StaffInvitation, UUID> {
    Optional<StaffInvitation> findByToken(String token);

    List<StaffInvitation> findByPlatformIdAndStatusOrderByCreatedAtDesc(UUID platformId, InvitationStatus status);
}
