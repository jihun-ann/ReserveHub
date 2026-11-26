package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

class PlatformApplicationServiceTest {

    private PlatformApplicationRepository repository;
    private PlatformService platformService;
    private PlatformApplicationService service;
    private final UUID applicantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        repository = mock(PlatformApplicationRepository.class);
        platformService = mock(PlatformService.class);
        service = new PlatformApplicationService(repository, platformService, mock(ActionLogger.class), mock(UserRepository.class), "build/test-uploads");
    }

    private static AuthenticatedUser principal(UUID id, Role role) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(id);
        when(user.getUsername()).thenReturn("u" + id);
        when(user.getPasswordHash()).thenReturn("h");
        when(user.getRole()).thenReturn(role);
        when(user.isActive()).thenReturn(true);
        return AuthenticatedUser.from(user);
    }

    private PlatformApplication pending() {
        return new PlatformApplication(applicantId, "새 스튜디오", BusinessType.FITNESS, null, null, null,
                "1234567891", "cert.pdf", "build/test-uploads/cert.pdf", "application/pdf");
    }

    @Test
    void businessNumberChecksumRejectsTypos() {
        assertEquals("1234567891", BusinessNumber.normalize("123-45-67891"));
        assertTrue(BusinessNumber.hasValidCheckDigit("1234567891"));
        assertFalse(BusinessNumber.hasValidCheckDigit("1234567890"));
        assertThrows(IllegalArgumentException.class, () -> BusinessNumber.normalize("123-45-6789"));
        assertThrows(IllegalArgumentException.class, () -> BusinessNumber.normalize(null));
    }

    @Test
    void onlyAdminCanApprove() {
        assertThrows(AccessDeniedException.class, () -> service.approve(UUID.randomUUID(), principal(applicantId, Role.USER), null));
        assertThrows(AccessDeniedException.class, () -> service.approve(UUID.randomUUID(), principal(applicantId, Role.OWNER), null));
        verify(platformService, never()).create(any(), anyString(), any(), any(), any(), any());
    }

    @Test
    void approveCreatesPlatformForApplicantExactlyOnce() {
        PlatformApplication application = pending();
        UUID appId = UUID.randomUUID();
        when(repository.getForUpdate(appId)).thenReturn(application);
        Platform platform = mock(Platform.class);
        UUID platformId = UUID.randomUUID();
        when(platform.getId()).thenReturn(platformId);
        when(platform.getName()).thenReturn("새 스튜디오");
        when(platformService.create(applicantId, "새 스튜디오", BusinessType.FITNESS, null, null, null)).thenReturn(platform);
        AuthenticatedUser admin = principal(UUID.randomUUID(), Role.ADMIN);

        service.approve(appId, admin, "확인 완료");

        assertEquals(PlatformApplicationStatus.APPROVED, application.getStatus());
        assertEquals(platformId, application.getPlatformId());
        // 이미 승인된 신청을 다시 승인해도 플랫폼이 또 만들어지지 않는다.
        assertThrows(IllegalStateException.class, () -> service.approve(appId, admin, null));
        verify(platformService, times(1)).create(any(), anyString(), any(), any(), any(), any());
    }

    @Test
    void rejectNeedsReason() {
        assertThrows(IllegalArgumentException.class, () -> service.reject(UUID.randomUUID(), principal(UUID.randomUUID(), Role.ADMIN), " "));
    }

    @Test
    void certificateMustBePdfOrImage() {
        var input = new PlatformApplicationService.ApplicationInput("새 스튜디오", BusinessType.FITNESS, null, null, null, "1234567891");
        MockMultipartFile svg = new MockMultipartFile("certificate", "x.svg", "image/svg+xml", "<svg/>".getBytes());
        assertThrows(IllegalArgumentException.class, () -> service.submit(principal(applicantId, Role.USER), input, svg));
        assertThrows(IllegalArgumentException.class, () -> service.submit(principal(applicantId, Role.USER), input, null));
        verify(repository, never()).save(any());
    }
}
