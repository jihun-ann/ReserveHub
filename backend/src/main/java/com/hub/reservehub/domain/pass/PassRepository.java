package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface PassRepository extends BaseRepository<Pass, UUID> {
    List<Pass> findByPlatformIdAndIsActiveTrue(UUID platformId);
}
