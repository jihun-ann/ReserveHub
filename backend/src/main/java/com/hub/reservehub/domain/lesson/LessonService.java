package com.hub.reservehub.domain.lesson;

import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.domain.program.SlotRepository;
import com.hub.reservehub.domain.reservation.Reservation;
import com.hub.reservehub.domain.reservation.ReservationRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records what actually happened for a slot on a given date (lesson) and who attended (attendance).
 * Attendance PRESENT/LATE deducts a session from the linked pass; NO_SHOW is handled separately by
 * the reservation domain so a class is never double-charged.
 * 슬롯+날짜로 실제 진행된 수업(lesson)과 출결을 기록한다. PRESENT/LATE 출결은 연결된 수강권에서
 * 세션을 차감하며, NO_SHOW는 reservation 도메인에서 별도 처리하므로 이중 차감이 발생하지 않는다.
 */
@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final AttendanceRepository attendanceRepository;
    private final SlotRepository slotRepository;
    private final ProgramRepository programRepository;
    private final ReservationRepository reservationRepository;
    private final UserPassRepository userPassRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public LessonService(
            LessonRepository lessonRepository, AttendanceRepository attendanceRepository,
            SlotRepository slotRepository, ProgramRepository programRepository,
            ReservationRepository reservationRepository, UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard
    ) {
        this.lessonRepository = lessonRepository;
        this.attendanceRepository = attendanceRepository;
        this.slotRepository = slotRepository;
        this.programRepository = programRepository;
        this.reservationRepository = reservationRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    public Lesson create(UUID slotId, AuthenticatedUser actor, LocalDate lessonDate) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        Program program = programRepository.findById(slot.getProgramId())
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
        verifyInstructorOrStaff(slot, program, actor);

        if (lessonRepository.findBySlotIdAndLessonDate(slotId, lessonDate).isPresent()) {
            throw new IllegalStateException("Lesson already recorded for this slot and date");
        }
        return lessonRepository.save(new Lesson(slotId, slot.getInstructorId(), program.getPlatformId(), program.getId(), lessonDate));
    }

    @Transactional
    public Lesson start(UUID lessonId, AuthenticatedUser actor) {
        Lesson lesson = findLesson(lessonId);
        verifyInstructorOrStaff(lesson, actor);
        lesson.start();
        return lesson;
    }

    @Transactional
    public Lesson end(UUID lessonId, AuthenticatedUser actor) {
        Lesson lesson = findLesson(lessonId);
        verifyInstructorOrStaff(lesson, actor);
        lesson.end();
        return lesson;
    }

    @Transactional
    public Attendance recordAttendance(
            UUID lessonId, AuthenticatedUser actor, UUID userId, AttendStatus status,
            @Nullable UUID reservationId, @Nullable String memo
    ) {
        Lesson lesson = findLesson(lessonId);
        verifyInstructorOrStaff(lesson, actor);

        if (attendanceRepository.existsByLessonIdAndUserId(lessonId, userId)) {
            throw new IllegalStateException("Attendance already recorded for this user");
        }
        Attendance attendance = attendanceRepository.save(new Attendance(lessonId, userId, reservationId, status, actor.getId(), memo));

        if ((status == AttendStatus.PRESENT || status == AttendStatus.LATE) && reservationId != null) {
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
            UserPass userPass = userPassRepository.findById(reservation.getUserPassId())
                    .orElseThrow(() -> new IllegalArgumentException("User pass not found"));
            userPass.useSession();
        }

        return attendance;
    }

    @Transactional(readOnly = true)
    public List<Attendance> listAttendance(UUID lessonId, AuthenticatedUser actor) {
        Lesson lesson = findLesson(lessonId);
        verifyInstructorOrStaff(lesson, actor);
        return attendanceRepository.findByLessonId(lessonId);
    }

    private void verifyInstructorOrStaff(Lesson lesson, AuthenticatedUser actor) {
        if (!lesson.getInstructorId().equals(actor.getId())) {
            platformAccessGuard.verify(lesson.getPlatformId(), actor);
        }
    }

    private void verifyInstructorOrStaff(Slot slot, Program program, AuthenticatedUser actor) {
        if (!slot.getInstructorId().equals(actor.getId())) {
            platformAccessGuard.verify(program.getPlatformId(), actor);
        }
    }

    private Lesson findLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
    }
}
