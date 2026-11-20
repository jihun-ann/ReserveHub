package com.hub.reservehub.domain.approval;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.PlatformRepository;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import com.hub.reservehub.domain.platform.PlatformTaxAccountantRepository;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

/**
 * 업무 요청 상태 규칙 — 담당자만 진행 중/완료, 요청자만 취소, 끝난 요청은 더 못 바꾼다.
 */
class WorkRequestServiceTest {

    private final UUID platformId = UUID.randomUUID();
    private final UUID requesterId = UUID.randomUUID();
    private final UUID assigneeId = UUID.randomUUID();
    private final WorkRequestRepository repository = mock(WorkRequestRepository.class);
    private final PlatformAccessGuard guard = mock(PlatformAccessGuard.class);
    private final WorkRequestService service = new WorkRequestService(
            repository, guard, mock(ActionLogger.class), mock(PlatformRepository.class),
            mock(PlatformStaffRepository.class), mock(PlatformTaxAccountantRepository.class), mock(UserRepository.class)
    );

    private WorkRequest openRequest() {
        WorkRequest request = new WorkRequest(platformId, requesterId, assigneeId, "명세서 보내주세요", null, null);
        when(repository.getOrThrow(any())).thenReturn(request);
        return request;
    }

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
    void assigneeMovesItForwardButCannotCancel() {
        WorkRequest request = openRequest();
        service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.IN_PROGRESS);
        service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.DONE);
        assertEquals(WorkRequestStatus.DONE, request.getStatus());

        openRequest();
        assertThrows(AccessDeniedException.class, () -> service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.CANCELED));
    }

    @Test
    void onlyRequesterCancelsAndOthersCannotComplete() {
        openRequest();
        assertThrows(AccessDeniedException.class, () -> service.changeStatus(UUID.randomUUID(), as(requesterId), WorkRequestStatus.DONE));
        assertThrows(AccessDeniedException.class, () -> service.changeStatus(UUID.randomUUID(), as(UUID.randomUUID()), WorkRequestStatus.DONE));
        WorkRequest request = openRequest();
        service.changeStatus(UUID.randomUUID(), as(requesterId), WorkRequestStatus.CANCELED);
        assertEquals(WorkRequestStatus.CANCELED, request.getStatus());
    }

    @Test
    void finishedRequestStaysFinished() {
        openRequest();
        service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.DONE);
        assertThrows(IllegalStateException.class, () -> service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.IN_PROGRESS));
    }

    @Test
    void requesterSendsDoneWorkBackAndAssigneeMustReconfirm() {
        WorkRequest request = openRequest();
        assertThrows(IllegalStateException.class, () -> service.changeStatus(UUID.randomUUID(), as(requesterId), WorkRequestStatus.REVISION_REQUESTED));
        service.markRead(UUID.randomUUID(), as(assigneeId));
        service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.DONE);
        assertThrows(AccessDeniedException.class, () -> service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.REVISION_REQUESTED));

        service.changeStatus(UUID.randomUUID(), as(requesterId), WorkRequestStatus.REVISION_REQUESTED);
        assertEquals(WorkRequestStatus.REVISION_REQUESTED, request.getStatus());
        assertEquals(null, request.getReadAt());
        service.changeStatus(UUID.randomUUID(), as(assigneeId), WorkRequestStatus.DONE);
        assertEquals(WorkRequestStatus.DONE, request.getStatus());
    }

    @Test
    void onlyRequesterMarksUrgentAndOnlyAssigneeReadsIt() {
        WorkRequest request = openRequest();
        service.markRead(UUID.randomUUID(), as(requesterId));
        assertEquals(null, request.getReadAt());
        assertThrows(AccessDeniedException.class, () -> service.markUrgent(UUID.randomUUID(), as(assigneeId)));
        service.markUrgent(UUID.randomUUID(), as(requesterId));
        assertEquals(true, request.isUrgent());
    }

    @Test
    void onlyOwnTodoCanBeDeleted() {
        openRequest(); // 남이 맡긴 업무 — 요청자도 담당자도 지울 수 없다
        assertThrows(AccessDeniedException.class, () -> service.deleteTodo(UUID.randomUUID(), as(requesterId)));
        assertThrows(AccessDeniedException.class, () -> service.deleteTodo(UUID.randomUUID(), as(assigneeId)));

        WorkRequest todo = new WorkRequest(platformId, assigneeId, assigneeId, "내 할 일", null, null);
        when(repository.getOrThrow(any())).thenReturn(todo);
        service.deleteTodo(UUID.randomUUID(), as(assigneeId));
        org.mockito.Mockito.verify(repository).delete(todo);
    }

    @Test
    void assigneeMustBelongToThePlatformOffice() {
        when(guard.isOfficeMember(platformId, assigneeId)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () -> service.create(platformId, as(requesterId), assigneeId, "제목", null, null, false));
    }
}
