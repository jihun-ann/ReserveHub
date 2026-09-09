package com.hub.reservehub.domain.program;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.pass.Pass;
import com.hub.reservehub.domain.pass.PassRepository;
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
    private final SlotMemberRepository slotMemberRepository;
    private final PassRepository passRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public ProgramService(
            ProgramRepository programRepository, SlotRepository slotRepository, SlotMemberRepository slotMemberRepository,
            PassRepository passRepository, PlatformAccessGuard platformAccessGuard, ActionLogRepository actionLogRepository
    ) {
        this.programRepository = programRepository;
        this.slotRepository = slotRepository;
        this.slotMemberRepository = slotMemberRepository;
        this.passRepository = passRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    public record ProgramView(Program program, @Nullable Pass linkedPass) {
        // 표시용 이름은 항상 연결된 수강권 이름을 우선한다 — 나중에 수강권 이름이 바뀌어도 매번
        // 최신값을 보여주기 위함 (사용자 요청: "프로그램 명칭은 수강권명이 되어야").
        public String displayName() {
            return linkedPass != null ? linkedPass.getName() : program.getName();
        }
    }

    @Transactional
    // 프로그램 이름은 자유 입력이 아니라 연결된 수강권(Pass)의 이름을 그대로 쓴다 — name 컬럼에는
    // 생성 시점 스냅샷을 저장해두지만(레거시 호환), 조회 시에는 항상 passId로 다시 join해서 최신
    // 수강권 이름을 보여준다 (list/get 참고).
    public Program create(
            UUID platformId, AuthenticatedUser actor, UUID passId, ProgramType type, @Nullable EnrollmentMode enrollmentMode,
            short capacity, short durationMin, @Nullable String description
    ) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        if (type == ProgramType.GROUP && enrollmentMode == null) {
            throw new IllegalArgumentException("enrollmentMode is required for GROUP programs (FIXED or APPLICATION)");
        }
        Pass pass = passRepository.findById(passId)
                .orElseThrow(() -> new IllegalArgumentException("Pass not found: " + passId));
        if (!pass.getPlatformId().equals(platformId)) {
            throw new IllegalArgumentException("Pass does not belong to this platform");
        }
        Program program = programRepository.save(new Program(
                platformId, pass.getName(), type, enrollmentMode, capacity, durationMin, description, passId
        ));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.PROGRAM_CHANGE, program.getId(), "CREATE", null));
        return program;
    }

    @Transactional
    public Program update(
            UUID programId, AuthenticatedUser actor, ProgramType type, @Nullable EnrollmentMode enrollmentMode,
            short capacity, short durationMin, @Nullable String description
    ) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        if (type == ProgramType.GROUP && enrollmentMode == null) {
            throw new IllegalArgumentException("enrollmentMode is required for GROUP programs (FIXED or APPLICATION)");
        }
        program.update(type, enrollmentMode, capacity, durationMin, description);
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, program.getId(), "UPDATE", null));
        return program;
    }

    @Transactional(readOnly = true)
    // Program catalogs are public across platforms (customers browse before buying) — no ownership check.
    // 프로그램 카탈로그는 플랫폼 간 공개 정보(고객이 구매 전에 둘러봄)이므로 소유권 검증을 하지 않는다.
    public List<ProgramView> list(UUID platformId) {
        return withLinkedPasses(programRepository.findByPlatformIdAndIsActiveTrue(platformId));
    }

    @Transactional(readOnly = true)
    public ProgramView get(UUID programId) {
        Program program = findProgram(programId);
        return withLinkedPasses(List.of(program)).get(0);
    }

    private List<ProgramView> withLinkedPasses(List<Program> programs) {
        Map<UUID, Pass> passesById = passRepository.findAllById(
                programs.stream().map(Program::getPassId).filter(java.util.Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(Pass::getId, Function.identity()));
        return programs.stream().map(p -> new ProgramView(p, p.getPassId() != null ? passesById.get(p.getPassId()) : null)).toList();
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
            UUID programId, AuthenticatedUser actor, @Nullable String name, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, @Nullable LocalDate validUntil
    ) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        Slot slot = slotRepository.save(new Slot(programId, name, instructorId, dayOfWeek, startTime, endTime, validFrom, validUntil));
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

    @Transactional
    // 고정형(PRIVATE, 또는 GROUP+FIXED) 슬롯 전용 — 신청형(GROUP+APPLICATION)은 매주 신청(Reservation)
    // 으로 처리하므로 고정 로스터를 쓰지 않는다. 정원(capacity)을 넘길 수 없고, 이미 등록된 사람은
    // 중복 등록할 수 없다.
    public SlotMember addSlotMember(UUID programId, UUID slotId, AuthenticatedUser actor, UUID userId, UUID userPassId) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        if (!program.isFixedRoster()) {
            throw new IllegalStateException("Application-mode GROUP programs use weekly reservations, not a fixed roster");
        }
        Slot slot = findSlot(slotId, programId);
        if (slotMemberRepository.existsBySlotIdAndUserIdAndIsActiveTrue(slotId, userId)) {
            throw new IllegalStateException("User is already on this slot's roster");
        }
        if (slotMemberRepository.findBySlotIdAndIsActiveTrue(slotId).size() >= program.getCapacity()) {
            throw new IllegalStateException("Slot roster is full");
        }
        SlotMember member = slotMemberRepository.save(new SlotMember(slotId, userId, userPassId));
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, member.getId(), "ADD_SLOT_MEMBER", null));
        return member;
    }

    @Transactional(readOnly = true)
    public List<SlotMember> listSlotMembers(UUID programId, UUID slotId) {
        findSlot(slotId, programId);
        return slotMemberRepository.findBySlotIdAndIsActiveTrue(slotId);
    }

    @Transactional
    public void removeSlotMember(UUID programId, UUID slotId, UUID memberId, AuthenticatedUser actor) {
        Program program = findProgram(programId);
        platformAccessGuard.verifyRole(program.getPlatformId(), actor, StaffRole.MANAGER);
        findSlot(slotId, programId);
        SlotMember member = slotMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Slot member not found"));
        if (!member.getSlotId().equals(slotId)) {
            throw new IllegalArgumentException("Slot member does not belong to this slot");
        }
        member.remove();
        actionLogRepository.save(ActionLog.of(program.getPlatformId(), actor.getId(), ActionTarget.PROGRAM_CHANGE, member.getId(), "REMOVE_SLOT_MEMBER", null));
    }

    private Slot findSlot(UUID slotId, UUID programId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        if (!slot.getProgramId().equals(programId)) {
            throw new IllegalArgumentException("Slot does not belong to this program");
        }
        return slot;
    }

    private Program findProgram(UUID programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
    }
}
