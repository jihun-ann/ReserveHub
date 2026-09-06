package com.hub.reservehub.domain.lesson;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    Optional<Lesson> findBySlotIdAndLessonDate(UUID slotId, LocalDate lessonDate);

    List<Lesson> findByInstructorId(UUID instructorId);

    List<Lesson> findByPlatformIdAndLessonDateBetween(UUID platformId, LocalDate from, LocalDate to);

    List<Lesson> findByInstructorIdAndLessonDateBetween(UUID instructorId, LocalDate from, LocalDate to);

    List<Lesson> findByInstructorIdAndPlatformIdAndLessonDateBetween(UUID instructorId, UUID platformId, LocalDate from, LocalDate to);
}
