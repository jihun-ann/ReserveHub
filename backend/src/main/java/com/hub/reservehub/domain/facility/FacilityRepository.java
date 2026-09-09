package com.hub.reservehub.domain.facility;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {
    List<Facility> findByPlatformIdAndIsActiveTrue(UUID platformId);
}
