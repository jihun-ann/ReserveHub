package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRequestRepository extends JpaRepository<WorkRequest, UUID> {
    List<WorkRequest> findByPlatformIdOrderByCreatedAtDesc(UUID platformId);
}
