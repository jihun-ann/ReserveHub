package com.hub.reservehub.domain.platform;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, UUID> {
    List<JoinRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<JoinRequest> findByPlatformIdAndStatusInOrderByCreatedAtDesc(UUID platformId, Collection<JoinRequestStatus> statuses);

    boolean existsByPlatformIdAndUserIdAndStatus(UUID platformId, UUID userId, JoinRequestStatus status);
}
