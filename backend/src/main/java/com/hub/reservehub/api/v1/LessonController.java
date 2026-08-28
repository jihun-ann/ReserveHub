package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.lesson.Attendance;
import com.hub.reservehub.domain.lesson.AttendStatus;
import com.hub.reservehub.domain.lesson.Lesson;
import com.hub.reservehub.domain.lesson.LessonHistoryService;
import com.hub.reservehub.domain.lesson.LessonService;
import com.hub.reservehub.domain.program.ProgramType;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'TUTOR')")
public class LessonController {

    private final LessonService lessonService;
    private final LessonHistoryService lessonHistoryService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public LessonController(
            LessonService lessonService, LessonHistoryService lessonHistoryService,
            CurrentAuthenticatedUser currentAuthenticatedUser
    ) {
        this.lessonService = lessonService;
        this.lessonHistoryService = lessonHistoryService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @GetMapping("/api/v1/platforms/{platformId}/lessons")
    public List<LessonHistoryResponse> listHistory(
            @PathVariable UUID platformId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return lessonHistoryService.list(platformId, currentAuthenticatedUser.get(), from, to).stream()
                .map(LessonHistoryResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/lessons/mine")
    public List<LessonHistoryResponse> listMine(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return lessonHistoryService.listMine(currentAuthenticatedUser.get(), from, to).stream()
                .map(LessonHistoryResponse::from)
                .toList();
    }

    @PostMapping("/api/v1/slots/{slotId}/lessons")
    public ResponseEntity<LessonResponse> create(@PathVariable UUID slotId, @Valid @RequestBody CreateLessonRequest request) {
        Lesson lesson = lessonService.create(slotId, currentAuthenticatedUser.get(), request.lessonDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(LessonResponse.from(lesson));
    }

    @PostMapping("/api/v1/lessons/{id}/start")
    public LessonResponse start(@PathVariable UUID id) {
        return LessonResponse.from(lessonService.start(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/lessons/{id}/end")
    public LessonResponse end(@PathVariable UUID id) {
        return LessonResponse.from(lessonService.end(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/lessons/{id}/attendances")
    public ResponseEntity<AttendanceResponse> recordAttendance(@PathVariable UUID id, @Valid @RequestBody RecordAttendanceRequest request) {
        Attendance attendance = lessonService.recordAttendance(
                id, currentAuthenticatedUser.get(), request.userId(), request.status(), request.reservationId(), request.memo()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(AttendanceResponse.from(attendance));
    }

    @GetMapping("/api/v1/lessons/{id}/attendances")
    public List<AttendanceResponse> listAttendance(@PathVariable UUID id) {
        return lessonService.listAttendance(id, currentAuthenticatedUser.get()).stream()
                .map(AttendanceResponse::from)
                .toList();
    }

    public record CreateLessonRequest(@NotNull LocalDate lessonDate) {
    }

    public record LessonHistoryResponse(
            UUID id, UUID slotId, UUID platformId, LocalDate lessonDate, UUID instructorId, String instructorEmail, String instructorName,
            UUID programId, String programName, ProgramType programType, short capacity,
            Instant startedAt, Instant endedAt, int totalAttendance, int presentCount
    ) {
        static LessonHistoryResponse from(LessonHistoryService.Entry e) {
            return new LessonHistoryResponse(
                    e.lesson().getId(), e.lesson().getSlotId(), e.lesson().getPlatformId(), e.lesson().getLessonDate(), e.lesson().getInstructorId(),
                    e.instructor() != null ? e.instructor().getEmail() : "-",
                    e.instructor() != null ? e.instructor().getName() : "-",
                    e.lesson().getProgramId(), e.program() != null ? e.program().getName() : "-",
                    e.program() != null ? e.program().getType() : null, e.program() != null ? e.program().getCapacity() : 0,
                    e.lesson().getStartedAt(), e.lesson().getEndedAt(),
                    e.totalAttendance(), e.presentCount()
            );
        }
    }

    public record RecordAttendanceRequest(@NotNull UUID userId, @NotNull AttendStatus status, UUID reservationId, String memo) {
    }

    public record LessonResponse(
            UUID id, UUID slotId, UUID instructorId, UUID platformId, UUID programId,
            LocalDate lessonDate, Instant startedAt, Instant endedAt
    ) {
        public static LessonResponse from(Lesson lesson) {
            return new LessonResponse(
                    lesson.getId(), lesson.getSlotId(), lesson.getInstructorId(), lesson.getPlatformId(),
                    lesson.getProgramId(), lesson.getLessonDate(), lesson.getStartedAt(), lesson.getEndedAt()
            );
        }
    }

    public record AttendanceResponse(UUID id, UUID lessonId, UUID userId, AttendStatus status, Instant checkedAt, UUID checkedBy) {
        public static AttendanceResponse from(Attendance attendance) {
            return new AttendanceResponse(
                    attendance.getId(), attendance.getLessonId(), attendance.getUserId(),
                    attendance.getStatus(), attendance.getCheckedAt(), attendance.getCheckedBy()
            );
        }
    }
}
