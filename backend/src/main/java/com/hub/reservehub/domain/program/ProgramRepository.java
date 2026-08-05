package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, UUID> {
    List<Program> findByPlatformIdAndIsActiveTrue(UUID platformId);
}
