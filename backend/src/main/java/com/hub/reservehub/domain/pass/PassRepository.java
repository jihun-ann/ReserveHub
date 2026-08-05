package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassRepository extends JpaRepository<Pass, UUID> {
    List<Pass> findByPlatformIdAndIsActiveTrue(UUID platformId);
}
