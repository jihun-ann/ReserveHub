package com.hub.reservehub.domain.facility;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityIssueRepository extends JpaRepository<FacilityIssue, UUID> {
    List<FacilityIssue> findByPlatformIdOrderByCreatedAtDesc(UUID platformId);
}
