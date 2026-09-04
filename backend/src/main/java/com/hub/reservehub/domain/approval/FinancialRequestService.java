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
 * 세무사가 플랫폼의 재무 일정(월급날/지출일/명세서 제출일)을 등록하면, 그 플랫폼의 오너/MANAGER가
 * 승인·반려한다 — ScheduleChangeRequestService와 같은 구조.
 */
@Service
public class FinancialRequestService {

    private final FinancialRequestRepository financialRequestRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public FinancialRequestService(
            FinancialRequestRepository financialRequestRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository
    ) {
        this.financialRequestRepository = financialRequestRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public FinancialRequest create(
            UUID platformId, AuthenticatedUser actor, FinancialRequestType type,
            String title, LocalDate eventDate, @Nullable String memo
    ) {
        platformAccessGuard.verifyTaxAccountant(platformId, actor);
        return financialRequestRepository.save(new FinancialRequest(platformId, actor.getId(), type, title, eventDate, memo));
    }

    @Transactional(readOnly = true)
    // 오너/MANAGER(승인 처리) 또는 이 플랫폼에 초대된 세무사(본인이 등록한 일정 확인) 둘 다 조회 가능.
    public List<FinancialRequest> list(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        return financialRequestRepository.findByPlatformId(platformId);
    }

    @Transactional
    public FinancialRequest approve(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        FinancialRequest request = findRequest(requestId);
        platformAccessGuard.verifyRole(request.getPlatformId(), actor, StaffRole.MANAGER);
        request.approve(memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "APPROVE", memo));
        return request;
    }

    @Transactional
    public FinancialRequest reject(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        FinancialRequest request = findRequest(requestId);
        platformAccessGuard.verifyRole(request.getPlatformId(), actor, StaffRole.MANAGER);
        request.reject(memo);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "REJECT", memo));
        return request;
    }

    private FinancialRequest findRequest(UUID requestId) {
        return financialRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Financial request not found"));
    }
}
