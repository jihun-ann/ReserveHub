package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * 운영 정지는 오너만 — 활성 스태프(매니저 포함)라도 플랫폼을 정지/해제할 수 없다.
 */
class PlatformServiceTest {

    private final UUID platformId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID staffId = UUID.randomUUID();
    private final PlatformRepository platformRepository = mock(PlatformRepository.class);
    private final PlatformStaffRepository staffRepository = mock(PlatformStaffRepository.class);
    private final PlatformAccessGuard guard = new PlatformAccessGuard(
            platformRepository, staffRepository, mock(PlatformTaxAccountantRepository.class), mock(ManagerGroupRepository.class), mock(UserPassRepository.class)
    );
    private final PlatformService service = new PlatformService(
            platformRepository, staffRepository, mock(PlatformTaxAccountantRepository.class), mock(UserPassRepository.class),
            guard, mock(ActionLogger.class), mock(ManagerGroupService.class), mock(UserService.class)
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

    @Test
    void activeStaffCannotSuspend() {
        when(staffRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, staffId)).thenReturn(true);
        assertThrows(PlatformAccessDeniedException.class, () -> service.setSuspended(platformId, as(staffId), true));
    }

    @Test
    void ownerCanSuspend() {
        Platform platform = new Platform("ABC123", "테스트", BusinessType.values()[0], null, null, null, ownerId);
        when(platformRepository.existsByIdAndCreatedBy(platformId, ownerId)).thenReturn(true);
        when(platformRepository.getOrThrow(any())).thenReturn(platform);
        service.setSuspended(platformId, as(ownerId), true);
        assertEquals(PlatformStatus.SUSPENDED, platform.getStatus());
    }
}
