package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManagerGroupRepository extends JpaRepository<ManagerGroup, UUID> {
    List<ManagerGroup> findByPlatformIdOrderByCreatedAtAsc(UUID platformId);

    boolean existsByPlatformIdAndName(UUID platformId, String name);
}
