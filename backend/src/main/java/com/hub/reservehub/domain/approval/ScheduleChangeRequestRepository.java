package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleChangeRequestRepository extends JpaRepository<ScheduleChangeRequest, UUID> {
    List<ScheduleChangeRequest> findByPlatformIdAndStatus(UUID platformId, RequestStatus status);
}
