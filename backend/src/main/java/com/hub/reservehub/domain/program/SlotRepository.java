package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotRepository extends JpaRepository<Slot, UUID> {
    List<Slot> findByProgramIdAndIsActiveTrue(UUID programId);

    List<Slot> findByInstructorIdAndIsActiveTrue(UUID instructorId);
}
