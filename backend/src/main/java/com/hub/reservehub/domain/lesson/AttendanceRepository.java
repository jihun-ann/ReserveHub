package com.hub.reservehub.domain.lesson;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByLessonId(UUID lessonId);

    boolean existsByLessonIdAndUserId(UUID lessonId, UUID userId);
}
