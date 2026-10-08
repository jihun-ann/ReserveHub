package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 스태프의 휴가 요청 — 매니저 또는 오너가 승인/반려한다 (ScheduleChangeRequestService와 동일한 구조).
 */
@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository
    ) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public LeaveRequest create(UUID platformId, AuthenticatedUser actor, LocalDate startDate, LocalDate endDate, @Nullable String reason) {
        platformAccessGuard.verify(platformId, actor);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate must not be before startDate");
        }
        LeaveRequest request = leaveRequestRepository.save(new LeaveRequest(platformId, actor.getId(), startDate, endDate, reason));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "CREATE",
                "휴가 신청: " + startDate + " ~ " + endDate + (reason == null || reason.isBlank() ? "" : " (사유: " + LogMemo.clip(reason, 100) + ")")));
        return request;
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> list(UUID platformId, AuthenticatedUser actor, RequestStatus status) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_APPROVAL);
        return leaveRequestRepository.findByPlatformIdAndStatus(platformId, status);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> listMine(AuthenticatedUser actor) {
        return leaveRequestRepository.findByRequestedBy(actor.getId());
    }

    @Transactional
    // 휴가 승인/반려는 HIGH 등급 매니저(또는 오너)만 — L/M 등급 매니저는 조회만 가능하다.
    public LeaveRequest approve(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        LeaveRequest request = findRequest(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.LEAVE_APPROVE);
        rejectSelfDecision(request, actor);
        request.approve(actor.getId(), memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "APPROVE",
                LogMemo.with("휴가 승인: " + request.getStartDate() + " ~ " + request.getEndDate(), memo)));
        return request;
    }

    @Transactional
    public LeaveRequest reject(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        LeaveRequest request = findRequest(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.LEAVE_APPROVE);
        rejectSelfDecision(request, actor);
        request.reject(actor.getId(), memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "REJECT",
                LogMemo.with("휴가 반려: " + request.getStartDate() + " ~ " + request.getEndDate(), memo)));
        return request;
    }

    // 매니저도 휴가 요청을 제출할 수 있어졌으니, 본인이 제출한 요청을 스스로 승인/반려하는 건 막는다
    // (다른 매니저 또는 오너가 처리해야 함).
    private void rejectSelfDecision(LeaveRequest request, AuthenticatedUser actor) {
        if (request.getRequestedBy().equals(actor.getId())) {
            throw new IllegalStateException("Cannot decide on your own leave request");
        }
    }

    private LeaveRequest findRequest(UUID requestId) {
        return leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
    }
}
