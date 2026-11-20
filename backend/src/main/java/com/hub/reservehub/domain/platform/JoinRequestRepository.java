package com.hub.reservehub.domain.platform;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface JoinRequestRepository extends BaseRepository<JoinRequest, UUID> {
    List<JoinRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<JoinRequest> findByPlatformIdAndStatusInOrderByCreatedAtDesc(UUID platformId, Collection<JoinRequestStatus> statuses);

    boolean existsByPlatformIdAndUserIdAndStatus(UUID platformId, UUID userId, JoinRequestStatus status);
}
