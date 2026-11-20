package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface OrderRepository extends BaseRepository<Order, UUID> {
    List<Order> findByUserId(UUID userId);

    List<Order> findByPlatformId(UUID platformId);
}
