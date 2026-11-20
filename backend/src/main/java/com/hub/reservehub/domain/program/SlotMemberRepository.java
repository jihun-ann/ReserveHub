package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface SlotMemberRepository extends BaseRepository<SlotMember, UUID> {
    List<SlotMember> findBySlotIdAndIsActiveTrue(UUID slotId);

    boolean existsBySlotIdAndUserIdAndIsActiveTrue(UUID slotId, UUID userId);
}
