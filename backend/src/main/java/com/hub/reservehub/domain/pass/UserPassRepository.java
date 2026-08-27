package com.hub.reservehub.domain.pass;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPassRepository extends JpaRepository<UserPass, UUID> {
    List<UserPass> findByUserId(UUID userId);

    List<UserPass> findByOrderItemId(UUID orderItemId);

    List<UserPass> findByPlatformId(UUID platformId);
}
