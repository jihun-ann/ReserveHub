package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface ScheduleChangeRequestRepository extends BaseRepository<ScheduleChangeRequest, UUID> {
    List<ScheduleChangeRequest> findByPlatformIdAndStatus(UUID platformId, RequestStatus status);

    List<ScheduleChangeRequest> findByRequestedBy(UUID requestedBy);
}
