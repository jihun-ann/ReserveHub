package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformStaffRepository extends JpaRepository<PlatformStaff, UUID> {
    Optional<PlatformStaff> findByPlatformIdAndUserId(UUID platformId, UUID userId);

    List<PlatformStaff> findByPlatformIdAndIsActiveTrue(UUID platformId);

    List<PlatformStaff> findByPlatformId(UUID platformId);

    List<PlatformStaff> findByUserIdAndIsActiveTrue(UUID userId);

    boolean existsByPlatformIdAndUserIdAndIsActiveTrue(UUID platformId, UUID userId);

    boolean existsByUserIdAndStaffRoleAndIsActiveTrue(UUID userId, StaffRole staffRole);
}
