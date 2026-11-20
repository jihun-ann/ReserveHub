package com.hub.reservehub.domain.approval;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.domain.program.SlotRepository;
import com.hub.reservehub.domain.reservation.Reservation;
import com.hub.reservehub.domain.reservation.ReservationRepository;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * 일정 변경 요청 — 경로의 platformId와 예약의 실제 플랫폼이 같아야 하고, 담당 강사도 가드를 거친다.
 */
class ScheduleChangeRequestServiceTest {

    private final UUID platformId = UUID.randomUUID();
    private final UUID instructorId = UUID.randomUUID();
    private final ScheduleChangeRequestRepository requestRepository = mock(ScheduleChangeRequestRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final SlotRepository slotRepository = mock(SlotRepository.class);
    private final ProgramRepository programRepository = mock(ProgramRepository.class);
    private final PlatformAccessGuard guard = mock(PlatformAccessGuard.class);
    private final ScheduleChangeRequestService service = new ScheduleChangeRequestService(
            requestRepository, reservationRepository, slotRepository, programRepository, guard,
            mock(ActionLogger.class), mock(OutboxEventRepository.class)
    );

    private static AuthenticatedUser as(UUID id) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(id);
        when(user.getUsername()).thenReturn("u");
        when(user.getPasswordHash()).thenReturn("h");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.isActive()).thenReturn(true);
        return AuthenticatedUser.from(user);
    }

    // 예약 → 슬롯(담당 강사 instructorId) → 프로그램(slotPlatformId) 순으로 연결해 둔다.
    private UUID reservationOn(UUID slotPlatformId) {
        Reservation reservation = new Reservation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), LocalDate.now());
        Slot slot = mock(Slot.class);
        when(slot.getProgramId()).thenReturn(UUID.randomUUID());
        when(slot.getInstructorId()).thenReturn(instructorId);
        Program program = mock(Program.class);
        when(program.getPlatformId()).thenReturn(slotPlatformId);
        when(reservationRepository.getOrThrow(any())).thenReturn(reservation);
        when(slotRepository.getOrThrow(any())).thenReturn(slot);
        when(programRepository.getOrThrow(any())).thenReturn(program);
        return UUID.randomUUID();
    }

    @Test
    void rejectsReservationFromAnotherPlatform() {
        UUID reservationId = reservationOn(UUID.randomUUID());
        assertThrows(IllegalArgumentException.class,
                () -> service.create(platformId, as(instructorId), reservationId, LocalDate.now(), null, null));
        verify(requestRepository, never()).save(any());
    }

    @Test
    void instructorStillNeedsPlatformAccess() {
        UUID reservationId = reservationOn(platformId);
        AuthenticatedUser instructor = as(instructorId);
        doThrow(new PlatformAccessDeniedException(platformId)).when(guard).verify(platformId, instructor);
        assertThrows(PlatformAccessDeniedException.class,
                () -> service.create(platformId, instructor, reservationId, LocalDate.now(), null, null));
        verify(requestRepository, never()).save(any());
    }
}
