package com.hub.reservehub.domain.approval;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * 시간 단위 휴가 규칙 — 하루짜리에만 1~7시간, 비우면 종일(연차).
 */
class LeaveRequestServiceTest {

    private final UUID platformId = UUID.randomUUID();
    private final LeaveRequestRepository repository = mock(LeaveRequestRepository.class);
    private final LeaveRequestService service = new LeaveRequestService(
            repository, mock(PlatformAccessGuard.class), mock(ActionLogger.class)
    );
    private final LocalDate day = LocalDate.of(2026, 11, 24);

    LeaveRequestServiceTest() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static AuthenticatedUser staff() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        when(user.getUsername()).thenReturn("u");
        when(user.getPasswordHash()).thenReturn("h");
        when(user.getRole()).thenReturn(Role.TUTOR);
        when(user.isActive()).thenReturn(true);
        return AuthenticatedUser.from(user);
    }

    @Test
    void hourlyLeaveIsOneDayAndOneToSevenHours() {
        assertEquals(2, service.create(platformId, staff(), day, day, 2, null).getHours());
        assertEquals(null, service.create(platformId, staff(), day, day.plusDays(2), null, null).getHours());

        assertThrows(IllegalArgumentException.class, () -> service.create(platformId, staff(), day, day.plusDays(1), 2, null));
        assertThrows(IllegalArgumentException.class, () -> service.create(platformId, staff(), day, day, 0, null));
        assertThrows(IllegalArgumentException.class, () -> service.create(platformId, staff(), day, day, 8, null));
    }
}
