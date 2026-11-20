package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface SlotRepository extends BaseRepository<Slot, UUID> {
    List<Slot> findByProgramIdAndIsActiveTrue(UUID programId);

    List<Slot> findByInstructorIdAndIsActiveTrue(UUID instructorId);
}
