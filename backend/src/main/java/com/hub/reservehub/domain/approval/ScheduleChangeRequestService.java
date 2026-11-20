package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.domain.outbox.OutboxEvent;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.domain.program.SlotRepository;
import com.hub.reservehub.domain.reservation.Reservation;
import com.hub.reservehub.domain.reservation.ReservationRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * A tutor's request to move a reservation's slot/date; MANAGER or OWNER approves or rejects it
 * (AGENT.md 3). Approval only records the decision — actually moving the reservation is a
 * separate, deliberate follow-up action, not an automatic side effect.
 * 강사가 예약 일정 변경을 요청하고 매니저/오너가 승인·반려한다. 승인은 결정만 기록하며,
 * 실제 예약 이동은 별도의 명시적 후속 작업이다(부수 효과로 자동 처리하지 않음).
 */
@Service
public class ScheduleChangeRequestService {

    private final ScheduleChangeRequestRepository requestRepository;
    private final ReservationRepository reservationRepository;
    private final SlotRepository slotRepository;
    private final ProgramRepository programRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogger actionLogger;
    private final OutboxEventRepository outboxEventRepository;

    public ScheduleChangeRequestService(
            ScheduleChangeRequestRepository requestRepository, ReservationRepository reservationRepository,
            SlotRepository slotRepository, ProgramRepository programRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogger actionLogger, OutboxEventRepository outboxEventRepository
    ) {
        this.requestRepository = requestRepository;
        this.reservationRepository = reservationRepository;
        this.slotRepository = slotRepository;
        this.programRepository = programRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogger = actionLogger;
        this.outboxEventRepository = outboxEventRepository;
    }

    @Transactional
    public ScheduleChangeRequest create(
            UUID platformId, AuthenticatedUser actor, UUID reservationId,
            LocalDate requestedDate, @Nullable UUID requestedSlot, @Nullable String reason
    ) {
        Reservation reservation = reservationRepository.getOrThrow(reservationId);
        // 경로의 platformId를 믿지 않는다 — 예약(과 바꿀 슬롯)이 실제로 이 플랫폼 소속인지 확인하고,
        // 담당 강사라도 이 플랫폼의 오너/활성 스태프여야 요청할 수 있다.
        requireSlotOnPlatform(reservation.getSlotId(), platformId);
        if (requestedSlot != null) {
            requireSlotOnPlatform(requestedSlot, platformId);
        }
        platformAccessGuard.verify(platformId, actor);

        ScheduleChangeRequest request = requestRepository.save(new ScheduleChangeRequest(
                platformId, actor.getId(), reservationId, reservation.getScheduledDate(),
                reservation.getSlotId(), requestedDate, requestedSlot, reason
        ));

        outboxEventRepository.save(OutboxEvent.of(
                "SCHEDULE_REQUEST", request.getId(), "schedule_request.created", "reservehub.schedule",
                Map.of("requestId", request.getId().toString(), "platformId", platformId.toString())
        ));

        return request;
    }

    @Transactional(readOnly = true)
    public List<ScheduleChangeRequest> list(UUID platformId, AuthenticatedUser actor, RequestStatus status) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_APPROVAL);
        return requestRepository.findByPlatformIdAndStatus(platformId, status);
    }

    @Transactional(readOnly = true)
    // A tutor's own submitted requests, across every platform — self-scoped, no guard needed.
    // 강사 본인이 제출한 요청 전체(소속 플랫폼 무관) — 본인 데이터라 가드가 필요 없다.
    public List<ScheduleChangeRequest> listMine(AuthenticatedUser actor) {
        return requestRepository.findByRequestedBy(actor.getId());
    }

    @Transactional
    public ScheduleChangeRequest approve(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        ScheduleChangeRequest request = requestRepository.getOrThrow(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.MENU_APPROVAL);
        request.approve(actor.getId(), memo);

        actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.SCHEDULE_REQUEST, request.getId(), "APPROVE",
                LogMemo.with("일정 변경 승인: " + request.getOriginalDate() + " → " + request.getRequestedDate(), memo));
        outboxEventRepository.save(OutboxEvent.of(
                "SCHEDULE_REQUEST", request.getId(), "schedule_request.approved", "reservehub.schedule",
                Map.of("requestId", request.getId().toString())
        ));

        return request;
    }

    @Transactional
    public ScheduleChangeRequest reject(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        ScheduleChangeRequest request = requestRepository.getOrThrow(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.MENU_APPROVAL);
        request.reject(actor.getId(), memo);

        actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.SCHEDULE_REQUEST, request.getId(), "REJECT",
                LogMemo.with("일정 변경 반려: " + request.getOriginalDate() + " → " + request.getRequestedDate(), memo));
        outboxEventRepository.save(OutboxEvent.of(
                "SCHEDULE_REQUEST", request.getId(), "schedule_request.rejected", "reservehub.schedule",
                Map.of("requestId", request.getId().toString())
        ));

        return request;
    }

    private void requireSlotOnPlatform(UUID slotId, UUID platformId) {
        Slot slot = slotRepository.getOrThrow(slotId);
        UUID slotPlatformId = programRepository.getOrThrow(slot.getProgramId())
                .getPlatformId();
        if (!slotPlatformId.equals(platformId)) {
            throw new IllegalArgumentException("이 플랫폼의 수업이 아닙니다.");
        }
    }
}
