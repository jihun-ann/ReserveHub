package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberMemoRepository extends JpaRepository<MemberMemo, UUID> {
    List<MemberMemo> findByPlatformIdAndUserId(UUID platformId, UUID userId);
}
