package com.hub.reservehub.domain.program;

import java.util.List;
import java.util.UUID;
import com.hub.reservehub.common.persistence.BaseRepository;

public interface ProgramRepository extends BaseRepository<Program, UUID> {
    List<Program> findByPlatformIdAndIsActiveTrue(UUID platformId);

    java.util.Optional<Program> findFirstByPassIdAndIsActiveTrue(UUID passId);
}
