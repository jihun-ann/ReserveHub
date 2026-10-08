package com.hub.reservehub.domain.lesson;

import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Joins lessons with their program and instructor for the manager-facing history/analytics view.
 * 매니저용 수업 이력/분석 화면을 위해 수업을 프로그램·강사 정보와 조합한다.
 */
@Service
public class LessonHistoryService {

    private final LessonRepository lessonRepository;
    private final AttendanceRepository attendanceRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public LessonHistoryService(
            LessonRepository lessonRepository, AttendanceRepository attendanceRepository,
            ProgramRepository programRepository, UserRepository userRepository,
            PlatformAccessGuard platformAccessGuard
    ) {
        this.lessonRepository = lessonRepository;
        this.attendanceRepository = attendanceRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional(readOnly = true)
    public List<Entry> list(UUID platformId, AuthenticatedUser actor, LocalDate from, LocalDate to) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_HISTORY);
        return enrich(lessonRepository.findByPlatformIdAndLessonDateBetween(platformId, from, to));
    }

    @Transactional(readOnly = true)
    // A tutor's own lessons across all platforms they teach at — no platform guard needed, it's self-scoped.
    // 강사 본인의 수업 목록(소속된 모든 플랫폼 포함) — 본인 데이터라 플랫폼 접근 검증이 필요 없다.
    public List<Entry> listMine(AuthenticatedUser actor, LocalDate from, LocalDate to) {
        return enrich(lessonRepository.findByInstructorIdAndLessonDateBetween(actor.getId(), from, to));
    }

    private List<Entry> enrich(List<Lesson> lessons) {
        Map<UUID, Program> programsById = programRepository.findAllById(lessons.stream().map(Lesson::getProgramId).distinct().toList())
                .stream().collect(Collectors.toMap(Program::getId, Function.identity()));
        Map<UUID, User> instructorsById = userRepository.findAllById(lessons.stream().map(Lesson::getInstructorId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));

        return lessons.stream().map(lesson -> {
            List<Attendance> attendances = attendanceRepository.findByLessonId(lesson.getId());
            long present = attendances.stream()
                    .filter(a -> a.getStatus() == AttendStatus.PRESENT || a.getStatus() == AttendStatus.LATE)
                    .count();
            return new Entry(
                    lesson, programsById.get(lesson.getProgramId()), instructorsById.get(lesson.getInstructorId()),
                    attendances.size(), (int) present
            );
        }).toList();
    }

    public record Entry(Lesson lesson, Program program, User instructor, int totalAttendance, int presentCount) {
    }
}
