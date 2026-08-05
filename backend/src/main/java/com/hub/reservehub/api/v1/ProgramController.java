package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.program.DayOfWeek;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramService;
import com.hub.reservehub.domain.program.ProgramType;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ProgramResponse> createProgram(
            @PathVariable UUID platformId, @Valid @RequestBody CreateProgramRequest request
    ) {
        Program program = programService.create(
                platformId, currentAuthenticatedUser.get(), request.name(), request.type(),
                request.capacity(), request.durationMin(), request.description()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ProgramResponse.from(program));
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

    @DeleteMapping("/api/v1/programs/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Void> deactivateProgram(@PathVariable UUID id) {
        programService.deactivate(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/programs/{id}/slots")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<SlotResponse> addSlot(@PathVariable UUID id, @Valid @RequestBody CreateSlotRequest request) {
        Slot slot = programService.addSlot(
                id, currentAuthenticatedUser.get(), request.instructorId(), request.dayOfWeek(),
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

    @DeleteMapping("/api/v1/programs/{id}/slots/{slotId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Void> deactivateSlot(@PathVariable UUID id, @PathVariable UUID slotId) {
        programService.deactivateSlot(id, slotId, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    public record CreateProgramRequest(
            @NotBlank String name,
            @NotNull ProgramType type,
            @Positive short capacity,
            @Positive short durationMin,
            String description
    ) {
    }

    public record CreateSlotRequest(
            @NotNull UUID instructorId,
            @NotNull DayOfWeek dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            @NotNull LocalDate validFrom,
            LocalDate validUntil
    ) {
    }

    public record ProgramResponse(
            UUID id, UUID platformId, String name, ProgramType type,
            short capacity, short durationMin, String description, boolean isActive
    ) {
        public static ProgramResponse from(Program program) {
            return new ProgramResponse(
                    program.getId(), program.getPlatformId(), program.getName(), program.getType(),
                    program.getCapacity(), program.getDurationMin(), program.getDescription(), program.isActive()
            );
        }
    }

    public record SlotResponse(
            UUID id, UUID programId, UUID instructorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, LocalDate validFrom, LocalDate validUntil, boolean isActive
    ) {
        public static SlotResponse from(Slot slot) {
            return new SlotResponse(
                    slot.getId(), slot.getProgramId(), slot.getInstructorId(), slot.getDayOfWeek(),
                    slot.getStartTime(), slot.getEndTime(), slot.getValidFrom(), slot.getValidUntil(), slot.isActive()
            );
        }
    }
}
