package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

// 회원 초대(staffRole == null): 수락하면 직원 배정이 아니라 승인된 가입 신청이 되어 "수강권 등록 대기"에 올라간다.
class MemberInvitationTest {

    private final UUID platformId = UUID.randomUUID();
    private final UUID inviterId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();

    private StaffInvitationRepository invitationRepository;
    private JoinRequestRepository joinRequestRepository;
    private PlatformService platformService;
    private UserService userService;
    private StaffInvitationService service;
    private AuthenticatedUser member;

    @BeforeEach
    void setUp() {
        invitationRepository = mock(StaffInvitationRepository.class);
        joinRequestRepository = mock(JoinRequestRepository.class);
        platformService = mock(PlatformService.class);
        userService = mock(UserService.class);
        PlatformRepository platformRepository = mock(PlatformRepository.class);
        PlatformStaffRepository staffRepository = mock(PlatformStaffRepository.class);
        ActionLogger actionLogger = mock(ActionLogger.class);

        User user = mock(User.class);
        when(user.getId()).thenReturn(memberId);
        when(user.getUsername()).thenReturn("member");
        when(user.getPasswordHash()).thenReturn("h");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.isActive()).thenReturn(true);
        when(user.getEmail()).thenReturn("member@test.com");
        when(userService.get(memberId)).thenReturn(user);
        member = AuthenticatedUser.from(user);

        when(joinRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        JoinRequestService joinRequestService = new JoinRequestService(
                joinRequestRepository, platformRepository, staffRepository, mock(UserPassRepository.class),
                mock(PlatformAccessGuard.class), userService, mock(UserRepository.class), actionLogger);
        service = new StaffInvitationService(
                invitationRepository, platformRepository, platformService, mock(PlatformAccessGuard.class),
                mock(ManagerGroupRepository.class), actionLogger, userService, joinRequestService, false);
    }

    private StaffInvitation memberInvite(String email) {
        StaffInvitation invitation = new StaffInvitation(platformId, null, null, null, email, null, inviterId, Instant.now().plusSeconds(3600));
        when(invitationRepository.findByToken(invitation.getToken())).thenReturn(Optional.of(invitation));
        return invitation;
    }

    @Test
    void acceptingMemberInviteCreatesApprovedJoinRequestNotStaff() {
        StaffInvitation invitation = memberInvite("member@test.com");

        service.accept(invitation.getToken(), member);

        assertEquals(InvitationStatus.ACCEPTED, invitation.getStatus());
        verify(platformService, never()).createAssignment(any(), any(), any(), any(), any());
        verify(joinRequestRepository).save(org.mockito.ArgumentMatchers.argThat(r ->
                r.getPlatformId().equals(platformId) && r.getUserId().equals(memberId)
                        && r.getStatus() == JoinRequestStatus.APPROVED && inviterId.equals(r.getDecidedBy())));
    }

    @Test
    void memberInviteStillRequiresMatchingContact() {
        StaffInvitation invitation = memberInvite("someone-else@test.com");

        assertThrows(IllegalArgumentException.class, () -> service.accept(invitation.getToken(), member));
        verify(joinRequestRepository, never()).save(any());
    }
}
