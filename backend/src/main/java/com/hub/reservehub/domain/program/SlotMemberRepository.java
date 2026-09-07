package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotMemberRepository extends JpaRepository<SlotMember, UUID> {
    List<SlotMember> findBySlotIdAndIsActiveTrue(UUID slotId);

    boolean existsBySlotIdAndUserIdAndIsActiveTrue(UUID slotId, UUID userId);
}
