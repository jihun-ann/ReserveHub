package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface WorkRequestRepository extends BaseRepository<WorkRequest, UUID> {
    List<WorkRequest> findByPlatformIdOrderByCreatedAtDesc(UUID platformId);

    List<WorkRequest> findByPlatformIdAndAssigneeIdOrderByCreatedAtDesc(UUID platformId, UUID assigneeId);
}
