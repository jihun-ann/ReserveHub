package com.hub.reservehub.domain.platform;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformRepository extends JpaRepository<Platform, UUID> {
    List<Platform> findByCreatedBy(UUID createdBy);

    boolean existsByIdAndCreatedBy(UUID id, UUID createdBy);

    boolean existsByCode(String code);

    Optional<Platform> findByCode(String code);

    // 회원이 가입 신청할 플랫폼을 이름으로 찾을 때 — 운영 중인 플랫폼만, 최대 20개.
    List<Platform> findTop20ByNameContainingIgnoreCaseAndStatusOrderByName(String name, PlatformStatus status);
}
