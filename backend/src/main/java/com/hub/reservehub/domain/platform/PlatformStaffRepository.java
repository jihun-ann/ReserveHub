package com.hub.reservehub.domain.platform;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformStaffRepository extends JpaRepository<PlatformStaff, UUID> {
    // 한 계정이 한 플랫폼에서 여러 StaffRole(예: MANAGER+TUTOR)을 동시에 가질 수 있어 목록으로 반환한다.
    List<PlatformStaff> findByPlatformIdAndUserId(UUID platformId, UUID userId);

    List<PlatformStaff> findByPlatformIdAndIsActiveTrue(UUID platformId);

    List<PlatformStaff> findByPlatformId(UUID platformId);

    List<PlatformStaff> findByUserIdAndIsActiveTrue(UUID userId);

    // 재직 여부와 무관한 전체 배정 이력 — 다른 사용자 조회 범위(UserDirectoryService)를 정할 때 쓴다.
    List<PlatformStaff> findByUserId(UUID userId);

    boolean existsByPlatformIdAndUserIdAndIsActiveTrue(UUID platformId, UUID userId);

    boolean existsByUserIdAndStaffRoleAndIsActiveTrue(UUID userId, StaffRole staffRole);
}
