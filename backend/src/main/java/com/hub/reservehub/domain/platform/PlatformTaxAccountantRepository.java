package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformTaxAccountantRepository extends JpaRepository<PlatformTaxAccountant, UUID> {
    List<PlatformTaxAccountant> findByPlatformIdAndIsActiveTrue(UUID platformId);

    List<PlatformTaxAccountant> findByUserIdAndIsActiveTrue(UUID userId);

    Optional<PlatformTaxAccountant> findByPlatformIdAndUserId(UUID platformId, UUID userId);

    boolean existsByPlatformIdAndUserIdAndIsActiveTrue(UUID platformId, UUID userId);
}
