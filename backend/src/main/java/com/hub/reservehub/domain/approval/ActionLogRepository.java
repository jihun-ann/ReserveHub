package com.hub.reservehub.domain.approval;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionLogRepository extends JpaRepository<ActionLog, UUID> {
}
