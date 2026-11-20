package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface LeaveRequestRepository extends BaseRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByPlatformIdAndStatus(UUID platformId, RequestStatus status);

    List<LeaveRequest> findByRequestedBy(UUID requestedBy);
}
