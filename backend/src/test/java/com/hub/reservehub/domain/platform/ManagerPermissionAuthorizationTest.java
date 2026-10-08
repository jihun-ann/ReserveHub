package com.hub.reservehub.domain.platform;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hub.reservehub.common.exception.PlatformAccessDeniedException;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.pass.CashReceiptStatus;
import com.hub.reservehub.domain.pass.DiscountPolicyRepository;
import com.hub.reservehub.domain.pass.MemberService;
import com.hub.reservehub.domain.pass.Order;
import com.hub.reservehub.domain.pass.OrderItemRepository;
import com.hub.reservehub.domain.pass.OrderDiscountRepository;
import com.hub.reservehub.domain.pass.OrderRepository;
import com.hub.reservehub.domain.pass.OrderService;
import com.hub.reservehub.domain.pass.PassRepository;
import com.hub.reservehub.domain.pass.PaymentMethod;
import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.AuthenticatedUserService;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * 매니저 그룹 권한 모델의 핵심 규칙 — DB 없이 모의 객체로 검증한다.
 * (예전 L/M/H 등급 통합 테스트는 등급이 사라지고 H2 시드도 없어져 이 테스트로 대체했다.)
 */
class ManagerPermissionAuthorizationTest {

    private final UUID platformId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID groupId = UUID.randomUUID();

    private PlatformRepository platformRepository;
    private PlatformStaffRepository staffRepository;
    private ManagerGroupRepository groupRepository;
    private PlatformAccessGuard guard;
    private AuthenticatedUser actor;

    @BeforeEach
    void setUp() {
        platformRepository = mock(PlatformRepository.class);
        staffRepository = mock(PlatformStaffRepository.class);
        groupRepository = mock(ManagerGroupRepository.class);
        guard = new PlatformAccessGuard(platformRepository, staffRepository, mock(PlatformTaxAccountantRepository.class), groupRepository);
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getUsername()).thenReturn("u");
        when(user.getPasswordHash()).thenReturn("h");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.isActive()).thenReturn(true);
        actor = AuthenticatedUser.from(user);
    }

    private void managerInGroup(Set<ManagerPermission> permissions) {
        PlatformStaff staff = mock(PlatformStaff.class);
        when(staff.isActive()).thenReturn(true);
        when(staff.getStaffRole()).thenReturn(StaffRole.MANAGER);
        when(staff.getManagerGroupId()).thenReturn(groupId);
        when(staffRepository.findByPlatformIdAndUserId(platformId, userId)).thenReturn(List.of(staff));
        ManagerGroup group = mock(ManagerGroup.class);
        when(group.getPermissions()).thenReturn(permissions);
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
    }

    @Test
    void ownerHasEveryPermission() {
        when(platformRepository.existsByIdAndCreatedBy(platformId, userId)).thenReturn(true);
        assertEquals(EnumSet.allOf(ManagerPermission.class), guard.permissionsOf(platformId, actor));
        assertDoesNotThrow(() -> guard.verifyManagerPermission(platformId, actor, ManagerPermission.REFUND));
    }

    @Test
    void managerOnlyGetsWhatHisGroupGrants() {
        managerInGroup(EnumSet.of(ManagerPermission.MENU_MEMBERS, ManagerPermission.TUTOR_MANAGE));
        assertTrue(guard.hasManagerPermission(platformId, actor, ManagerPermission.MENU_MEMBERS));
        assertTrue(guard.hasManagerPermission(platformId, actor, ManagerPermission.REFUND, ManagerPermission.TUTOR_MANAGE));
        assertFalse(guard.hasManagerPermission(platformId, actor, ManagerPermission.REFUND));
        assertThrows(PlatformAccessDeniedException.class,
                () -> guard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_PAYMENT));
    }

    @Test
    void managerWithoutGroupHasNoPermissionsAndTutorHasNoManagerPermissions() {
        PlatformStaff noGroup = mock(PlatformStaff.class);
        when(noGroup.isActive()).thenReturn(true);
        when(noGroup.getStaffRole()).thenReturn(StaffRole.MANAGER);
        when(noGroup.getManagerGroupId()).thenReturn(null);
        PlatformStaff tutor = mock(PlatformStaff.class);
        when(tutor.isActive()).thenReturn(true);
        when(tutor.getStaffRole()).thenReturn(StaffRole.TUTOR);
        when(staffRepository.findByPlatformIdAndUserId(platformId, userId)).thenReturn(List.of(noGroup, tutor));
        assertTrue(guard.permissionsOf(platformId, actor).isEmpty());
    }

    @Test
    void staffRolesFromAssignmentsReachSpringAuthoritiesEvenForUserAccounts() {
        UserRepository userRepository = mock(UserRepository.class);
        User invited = mock(User.class);
        when(invited.getId()).thenReturn(userId);
        when(invited.getUsername()).thenReturn("invited");
        when(invited.getPasswordHash()).thenReturn("h");
        when(invited.getRole()).thenReturn(Role.USER); // 초대로 합류한 사람은 전역 역할이 USER다
        when(invited.isActive()).thenReturn(true);
        when(userRepository.findByUsername("invited")).thenReturn(Optional.of(invited));
        PlatformStaff manager = mock(PlatformStaff.class);
        when(manager.getStaffRole()).thenReturn(StaffRole.MANAGER);
        when(staffRepository.findByUserIdAndIsActiveTrue(userId)).thenReturn(List.of(manager));

        UserDetails details = new AuthenticatedUserService(userRepository, staffRepository).loadUserByUsername("invited");

        Set<String> authorities = details.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(java.util.stream.Collectors.toSet());
        assertEquals(Set.of("ROLE_USER", "ROLE_MANAGER"), authorities);
    }

    @Test
    void deactivatedAccountIsNotEnabled() {
        User gone = mock(User.class);
        when(gone.getId()).thenReturn(userId);
        when(gone.getUsername()).thenReturn("gone");
        when(gone.getPasswordHash()).thenReturn("h");
        when(gone.getRole()).thenReturn(Role.USER);
        when(gone.isActive()).thenReturn(false);
        assertFalse(AuthenticatedUser.from(gone).isEnabled());
    }

    @Test
    void buyerCannotConfirmTheirOwnPaymentButAuthorizedStaffCan() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        PlatformAccessGuard guardMock = mock(PlatformAccessGuard.class);
        OrderService orderService = new OrderService(
                orderRepository, mock(OrderItemRepository.class), mock(OrderDiscountRepository.class), mock(PassRepository.class),
                mock(DiscountPolicyRepository.class), mock(UserPassRepository.class), guardMock, mock(ActionLogRepository.class),
                mock(OutboxEventRepository.class));
        // 구매자 본인(userId)이 자기 주문을 결제 확정하려는 상황
        Order order = new Order(userId, platformId, 100_000, 0, 100_000, null, userId);
        UUID orderId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        org.mockito.Mockito.doThrow(new PlatformAccessDeniedException(platformId))
                .when(guardMock).verifyManagerPermission(eq(platformId), any(), eq(ManagerPermission.MENU_PAYMENT));

        assertThrows(PlatformAccessDeniedException.class,
                () -> orderService.pay(orderId, actor, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null));
        assertEquals(com.hub.reservehub.domain.pass.OrderStatus.PENDING, order.getStatus(), "거절되면 주문은 결제되지 않은 상태로 남는다");
    }

    @Test
    void tutorSeesMembersWithoutContactDetailsWhileManagerWithPermissionSeesThem() {
        UserPassRepository userPassRepository = mock(UserPassRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PassRepository passRepository = mock(PassRepository.class);
        PlatformAccessGuard guardMock = mock(PlatformAccessGuard.class);
        MemberService memberService = new MemberService(userPassRepository, passRepository, userRepository, guardMock);

        UUID memberId = UUID.randomUUID();
        UserPass userPass = mock(UserPass.class);
        when(userPass.getUserId()).thenReturn(memberId);
        when(userPass.getPassId()).thenReturn(UUID.randomUUID());
        when(userPassRepository.findByPlatformId(platformId)).thenReturn(List.of(userPass));
        User member = mock(User.class);
        when(member.getId()).thenReturn(memberId);
        when(userRepository.findAllById(any())).thenReturn(List.of(member));
        when(passRepository.findAllById(any())).thenReturn(List.of());

        // 연락처 권한이 없는 강사 → verifyRole(TUTOR)을 통과하고 contactVisible=false
        when(guardMock.hasManagerPermission(eq(platformId), any(), any(ManagerPermission[].class))).thenReturn(false);
        assertFalse(memberService.list(platformId, actor).get(0).contactVisible());

        // 회원/결제/수업 권한이 있는 매니저 → contactVisible=true
        when(guardMock.hasManagerPermission(eq(platformId), any(), any(ManagerPermission[].class))).thenReturn(true);
        assertTrue(memberService.list(platformId, actor).get(0).contactVisible());
    }
}
