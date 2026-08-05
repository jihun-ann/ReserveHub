package com.hub.reservehub.domain.program;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final SlotRepository slotRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public ProgramService(ProgramRepository programRepository, SlotRepository slotRepository, PlatformAccessGuard platformAccessGuard) {
        this.programRepository = programRepository;
        this.slotRepository = slotRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    public Program create(
            UUID platformId, AuthenticatedUser actor, String name, ProgramType type,
            short capacity, short durationMin, @Nullable String description
    ) {
        platformAccessGuard.verify(platformId, actor);
        return programRepository.save(new Program(platformId, name, type, capacity, durationMin, description));
    }

    @Transactional(readOnly = true)
    // Program catalogs are public across platforms (customers browse before buying) — no ownership check.
    // 프로그램 카탈로그는 플랫폼 간 공개 정보(고객이 구매 전에 둘러봄)이므로 소유권 검증을 하지 않는다.
    public List<Program> list(UUID platformId) {
        return programRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional(readOnly = true)
    public Program get(UUID programId) {
        return findProgram(programId);
    }

    @Transactional
    public void deactivate(UUID programId, AuthenticatedUser actor) {
        Program program = findProgram(programId);
        platformAccessGuard.verify(program.getPlatformId(), actor);
        program.deactivate();
    }

    @Transactional
    public Slot addSlot(
            UUID programId, AuthenticatedUser actor, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, @Nullable LocalDate validUntil
    ) {
        Program program = findProgram(programId);
        platformAccessGuard.verify(program.getPlatformId(), actor);
        return slotRepository.save(new Slot(programId, instructorId, dayOfWeek, startTime, endTime, validFrom, validUntil));
    }

    @Transactional(readOnly = true)
    public List<Slot> listSlots(UUID programId) {
        return slotRepository.findByProgramIdAndIsActiveTrue(programId);
    }

    @Transactional
    public void deactivateSlot(UUID programId, UUID slotId, AuthenticatedUser actor) {
        Program program = findProgram(programId);
        platformAccessGuard.verify(program.getPlatformId(), actor);
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        slot.deactivate();
    }

    private Program findProgram(UUID programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
    }
}
