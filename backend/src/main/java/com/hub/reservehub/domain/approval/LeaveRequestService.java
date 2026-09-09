package com.hub.reservehub.domain.approval;

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
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "CREATE", null));
        return request;
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> list(UUID platformId, AuthenticatedUser actor, RequestStatus status) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        return leaveRequestRepository.findByPlatformIdAndStatus(platformId, status);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> listMine(AuthenticatedUser actor) {
        return leaveRequestRepository.findByRequestedBy(actor.getId());
    }

    @Transactional
    public LeaveRequest approve(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        LeaveRequest request = findRequest(requestId);
        platformAccessGuard.verifyRole(request.getPlatformId(), actor, StaffRole.MANAGER);
        request.approve(actor.getId(), memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "APPROVE", memo));
        return request;
    }

    @Transactional
    public LeaveRequest reject(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        LeaveRequest request = findRequest(requestId);
        platformAccessGuard.verifyRole(request.getPlatformId(), actor, StaffRole.MANAGER);
        request.reject(actor.getId(), memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.LEAVE_REQUEST, request.getId(), "REJECT", memo));
        return request;
    }

    private LeaveRequest findRequest(UUID requestId) {
        return leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
    }
}
