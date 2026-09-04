package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionLogRepository extends JpaRepository<ActionLog, UUID> {
    List<ActionLog> findByPlatformIdOrderByCreatedAtDesc(UUID platformId);
}
