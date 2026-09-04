package com.hub.reservehub.domain.program;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final SlotRepository slotRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public ProgramService(
            ProgramRepository programRepository, SlotRepository slotRepository,
            PlatformAccessGuard platformAccessGuard, ActionLogRepository actionLogRepository
    ) {
        this.programRepository = programRepository;
        this.slotRepository = slotRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public Program create(
            UUID platformId, AuthenticatedUser actor, String name, ProgramType type,
            short capacity, short durationMin, @Nullable String description
    ) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        Program program = programRepository.save(new Program(platformId, name, type, capacity, durationMin, description));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.PROGRAM_CHANGE, program.getId(), "CREATE", null));
        return program;
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
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        program.deactivate();
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, program.getId(), "DEACTIVATE", null));
    }

    @Transactional
    public Slot addSlot(
            UUID programId, AuthenticatedUser actor, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, @Nullable LocalDate validUntil
    ) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        Slot slot = slotRepository.save(new Slot(programId, instructorId, dayOfWeek, startTime, endTime, validFrom, validUntil));
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, slot.getId(), "ADD_SLOT", null));
        return slot;
    }

    @Transactional(readOnly = true)
    public List<Slot> listSlots(UUID programId) {
        return slotRepository.findByProgramIdAndIsActiveTrue(programId);
    }

    @Transactional
    public void deactivateSlot(UUID programId, UUID slotId, AuthenticatedUser actor) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        slot.deactivate();
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, slot.getId(), "DEACTIVATE_SLOT", null));
    }

    @Transactional(readOnly = true)
    // A tutor's own fixed weekly timetable, across every platform they teach at — self-scoped, no guard needed.
    // 강사 본인의 고정 주간 시간표(소속된 모든 플랫폼 포함) — 본인 데이터라 가드가 필요 없다.
    public List<SlotWithProgram> listMySlots(AuthenticatedUser actor) {
        List<Slot> slots = slotRepository.findByInstructorIdAndIsActiveTrue(actor.getId());
        Map<UUID, Program> programsById = programRepository.findAllById(slots.stream().map(Slot::getProgramId).distinct().toList())
                .stream().collect(Collectors.toMap(Program::getId, Function.identity()));
        return slots.stream().map(slot -> new SlotWithProgram(slot, programsById.get(slot.getProgramId()))).toList();
    }

    public record SlotWithProgram(Slot slot, Program program) {
    }

    private Program findProgram(UUID programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
    }
}
