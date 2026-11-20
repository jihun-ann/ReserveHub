package com.hub.reservehub.domain.facility;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface FacilityRepository extends BaseRepository<Facility, UUID> {
    List<Facility> findByPlatformIdAndIsActiveTrue(UUID platformId);
}
