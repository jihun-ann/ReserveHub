package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.lesson.Attendance;
import com.hub.reservehub.domain.lesson.AttendStatus;
import com.hub.reservehub.domain.lesson.Lesson;
import com.hub.reservehub.domain.lesson.LessonService;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
public class LessonController {

    private final LessonService lessonService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public LessonController(LessonService lessonService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.lessonService = lessonService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
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
