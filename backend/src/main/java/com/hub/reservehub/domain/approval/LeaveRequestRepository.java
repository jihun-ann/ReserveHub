package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByPlatformIdAndStatus(UUID platformId, RequestStatus status);

    List<LeaveRequest> findByRequestedBy(UUID requestedBy);
}
