package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface UserPassRepository extends BaseRepository<UserPass, UUID> {
    List<UserPass> findByUserId(UUID userId);

    List<UserPass> findByOrderItemId(UUID orderItemId);

    List<UserPass> findByPlatformId(UUID platformId);
}
