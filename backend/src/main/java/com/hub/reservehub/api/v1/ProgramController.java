package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.program.DayOfWeek;
import com.hub.reservehub.domain.program.EnrollmentMode;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramService;
import com.hub.reservehub.domain.program.ProgramType;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ProgramController {

    private final ProgramService programService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public ProgramController(ProgramService programService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.programService = programService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/programs")
    public ResponseEntity<ProgramResponse> createProgram(
            @PathVariable UUID platformId, @Valid @RequestBody CreateProgramRequest request
    ) {
        Program program = programService.create(
                platformId, currentAuthenticatedUser.get(), request.passId(), request.type(), request.enrollmentMode(),
                request.capacity(), request.durationMin(), request.description()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ProgramResponse.from(programService.get(program.getId())));
    }

    @GetMapping("/api/v1/platforms/{platformId}/programs")
    public List<ProgramResponse> listPrograms(@PathVariable UUID platformId) {
        return programService.list(platformId).stream()
                .map(ProgramResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/programs/{id}")
    public ProgramResponse getProgram(@PathVariable UUID id) {
        return ProgramResponse.from(programService.get(id));
    }

    @PatchMapping("/api/v1/programs/{id}")
    public ProgramResponse updateProgram(@PathVariable UUID id, @Valid @RequestBody UpdateProgramRequest request) {
        programService.update(
                id, currentAuthenticatedUser.get(), request.type(), request.enrollmentMode(),
                request.capacity(), request.durationMin(), request.description()
        );
        return ProgramResponse.from(programService.get(id));
    }

    @DeleteMapping("/api/v1/programs/{id}")
    public ResponseEntity<Void> deactivateProgram(@PathVariable UUID id) {
        programService.deactivate(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/programs/{id}/slots")
    public ResponseEntity<SlotResponse> addSlot(@PathVariable UUID id, @Valid @RequestBody CreateSlotRequest request) {
        Slot slot = programService.addSlot(
                id, currentAuthenticatedUser.get(), request.name(), request.instructorId(), request.dayOfWeek(),
                request.startTime(), request.endTime(), request.validFrom(), request.validUntil()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(SlotResponse.from(slot));
    }

    @GetMapping("/api/v1/programs/{id}/slots")
    public List<SlotResponse> listSlots(@PathVariable UUID id) {
        return programService.listSlots(id).stream()
                .map(SlotResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/slots/mine")
    public List<MySlotResponse> listMySlots() {
        return programService.listMySlots(currentAuthenticatedUser.get()).stream()
                .map(MySlotResponse::from)
                .toList();
    }

    @DeleteMapping("/api/v1/programs/{id}/slots/{slotId}")
    public ResponseEntity<Void> deactivateSlot(@PathVariable UUID id, @PathVariable UUID slotId) {
        programService.deactivateSlot(id, slotId, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record CreateProgramRequest(
            @NotNull UUID passId,
            @NotNull ProgramType type,
            EnrollmentMode enrollmentMode,
            @Positive short capacity,
            @Positive short durationMin,
            String description
    ) {
    }

    public record UpdateProgramRequest(
            @NotNull ProgramType type,
            EnrollmentMode enrollmentMode,
            @Positive short capacity,
            @Positive short durationMin,
            String description
    ) {
    }

    public record CreateSlotRequest(
            String name,
            @NotNull UUID instructorId,
            @NotNull DayOfWeek dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            @NotNull LocalDate validFrom,
            LocalDate validUntil
    ) {
    }

    public record ProgramResponse(
            UUID id, UUID platformId, UUID passId, String name, ProgramType type, EnrollmentMode enrollmentMode,
            short capacity, short durationMin, String description, boolean isActive
    ) {
        public static ProgramResponse from(ProgramService.ProgramView view) {
            Program program = view.program();
            return new ProgramResponse(
                    program.getId(), program.getPlatformId(), program.getPassId(), view.displayName(), program.getType(),
                    program.getEnrollmentMode(), program.getCapacity(), program.getDurationMin(), program.getDescription(), program.isActive()
            );
        }
    }

    public record SlotResponse(
            UUID id, UUID programId, String name, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, LocalDate validUntil, boolean isActive
    ) {
        public static SlotResponse from(Slot slot) {
            return new SlotResponse(
                    slot.getId(), slot.getProgramId(), slot.getName(), slot.getInstructorId(), slot.getDayOfWeek(),
                    slot.getStartTime(), slot.getEndTime(), slot.getValidFrom(), slot.getValidUntil(), slot.isActive()
            );
        }
    }

    public record MySlotResponse(
            UUID id, UUID platformId, UUID programId, String slotName, String programName, ProgramType programType,
            short capacity, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime
    ) {
        static MySlotResponse from(ProgramService.SlotWithProgram sp) {
            return new MySlotResponse(
                    sp.slot().getId(), sp.program() != null ? sp.program().getPlatformId() : null,
                    sp.slot().getProgramId(), sp.slot().getName(), sp.program() != null ? sp.program().getName() : "-",
                    sp.program() != null ? sp.program().getType() : null, sp.program() != null ? sp.program().getCapacity() : 0,
                    sp.slot().getDayOfWeek(), sp.slot().getStartTime(), sp.slot().getEndTime()
            );
        }
    }
}
