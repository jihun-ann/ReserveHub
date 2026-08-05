package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformRepository extends JpaRepository<Platform, UUID> {
    List<Platform> findByCreatedBy(UUID createdBy);

    boolean existsByIdAndCreatedBy(UUID id, UUID createdBy);
}
