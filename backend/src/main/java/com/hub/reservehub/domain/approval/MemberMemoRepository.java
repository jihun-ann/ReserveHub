package com.hub.reservehub.domain.approval;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface MemberMemoRepository extends BaseRepository<MemberMemo, UUID> {
    List<MemberMemo> findByPlatformIdAndUserId(UUID platformId, UUID userId);
}
