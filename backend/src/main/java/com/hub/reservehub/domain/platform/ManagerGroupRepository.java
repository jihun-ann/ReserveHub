package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface ManagerGroupRepository extends BaseRepository<ManagerGroup, UUID> {
    List<ManagerGroup> findByPlatformIdOrderByCreatedAtAsc(UUID platformId);

    boolean existsByPlatformIdAndName(UUID platformId, String name);
}
