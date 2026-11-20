package com.hub.reservehub.domain.facility;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface FacilityIssueRepository extends BaseRepository<FacilityIssue, UUID> {
    List<FacilityIssue> findByPlatformIdOrderByCreatedAtDesc(UUID platformId);
}
