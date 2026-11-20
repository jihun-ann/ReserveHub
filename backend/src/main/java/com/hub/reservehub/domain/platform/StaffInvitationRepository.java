package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface StaffInvitationRepository extends BaseRepository<StaffInvitation, UUID> {
    Optional<StaffInvitation> findByToken(String token);

    List<StaffInvitation> findByPlatformIdAndStatusOrderByCreatedAtDesc(UUID platformId, InvitationStatus status);
}
