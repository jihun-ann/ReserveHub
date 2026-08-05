package com.hub.reservehub.domain.reservation;

import com.hub.reservehub.domain.outbox.OutboxEvent;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.pass.UserPassStatus;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.program.DayOfWeek;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.domain.program.SlotRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Books/cancels individual class instances (slot + date) against a user's pass.
 * Session deduction on outright no-show only, matching the documented event table (AGENT.md 5);
 * attendance-based deduction belongs to the lesson domain.
 * 슬롯+날짜로 실제 수업 인스턴스를 예약/취소한다. 세션 차감은 노쇼 시에만 발생하며(AGENT.md 5 이벤트 목록 기준),
 * 출석에 따른 차감은 lesson 도메인에서 처리한다.
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final SlotRepository slotRepository;
    private final ProgramRepository programRepository;
    private final UserPassRepository userPassRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final OutboxEventRepository outboxEventRepository;

    public ReservationService(
            ReservationRepository reservationRepository, SlotRepository slotRepository,
            ProgramRepository programRepository, UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard, OutboxEventRepository outboxEventRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.slotRepository = slotRepository;
        this.programRepository = programRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.outboxEventRepository = outboxEventRepository;
    }

    @Transactional
    public Reservation create(UUID slotId, AuthenticatedUser actor, LocalDate scheduledDate, UUID userPassId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        if (!slot.isActive()) {
            throw new IllegalStateException("Slot is not active");
        }
        if (toDomainDayOfWeek(scheduledDate) != slot.getDayOfWeek()) {
            throw new IllegalArgumentException("scheduledDate does not match the slot's day of week");
        }
        if (scheduledDate.isBefore(slot.getValidFrom()) || (slot.getValidUntil() != null && scheduledDate.isAfter(slot.getValidUntil()))) {
            throw new IllegalArgumentException("scheduledDate is outside the slot's valid range");
        }

        Program program = programRepository.findById(slot.getProgramId())
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));

        UserPass userPass = userPassRepository.findById(userPassId)
                .orElseThrow(() -> new IllegalArgumentException("User pass not found"));
        if (!userPass.getUserId().equals(actor.getId())) {
            throw new IllegalArgumentException("User pass does not belong to the current user");
        }
        if (!userPass.getPlatformId().equals(program.getPlatformId())) {
            throw new IllegalArgumentException("User pass is not valid for this platform");
        }
        if (userPass.getStatus() != UserPassStatus.ACTIVE || userPass.getExpiresAt().isBefore(scheduledDate)) {
            throw new IllegalStateException("User pass is not usable for this date");
        }

        if (reservationRepository.existsByUserIdAndSlotIdAndScheduledDate(actor.getId(), slotId, scheduledDate)) {
            throw new IllegalStateException("Already reserved for this slot and date");
        }
        int confirmedCount = reservationRepository.countBySlotIdAndScheduledDateAndStatus(slotId, scheduledDate, ReservationStatus.CONFIRMED);
        if (confirmedCount >= program.getCapacity()) {
            throw new IllegalStateException("Slot is full for this date");
        }

        Reservation reservation = reservationRepository.save(new Reservation(actor.getId(), slotId, userPassId, scheduledDate));

        outboxEventRepository.save(OutboxEvent.of(
                "RESERVATION", reservation.getId(), "reservation.confirmed", "reservehub.reservation",
                Map.of("reservationId", reservation.getId().toString(), "userId", actor.getId().toString())
        ));

        return reservation;
    }

    @Transactional(readOnly = true)
    public List<Reservation> myReservations(AuthenticatedUser actor) {
        return reservationRepository.findByUserId(actor.getId());
    }

    @Transactional(readOnly = true)
    // Staff roster view for a given class instance; requires platform access on the owning program.
    // 특정 수업 인스턴스의 스태프용 명단 조회. 담당 프로그램의 플랫폼 접근 권한이 필요하다.
    public List<Reservation> listForSlot(UUID slotId, LocalDate scheduledDate, AuthenticatedUser actor) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        Program program = programRepository.findById(slot.getProgramId())
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
        platformAccessGuard.verify(program.getPlatformId(), actor);
        return reservationRepository.findBySlotIdAndScheduledDate(slotId, scheduledDate);
    }

    @Transactional
    public Reservation cancel(UUID reservationId, AuthenticatedUser actor, @Nullable String reason) {
        Reservation reservation = findReservation(reservationId);
        if (!reservation.getUserId().equals(actor.getId())) {
            Program program = programOf(reservation);
            platformAccessGuard.verify(program.getPlatformId(), actor);
        }
        reservation.cancel(reason);

        outboxEventRepository.save(OutboxEvent.of(
                "RESERVATION", reservation.getId(), "reservation.cancelled", "reservehub.reservation",
                Map.of("reservationId", reservation.getId().toString(), "userId", reservation.getUserId().toString())
        ));

        return reservation;
    }

    @Transactional
    // Staff-only: records a no-show and deducts the session as a penalty (AGENT.md event: reservation.no_show).
    // 스태프 전용: 노쇼를 기록하고 페널티로 세션을 차감한다.
    public Reservation markNoShow(UUID reservationId, AuthenticatedUser actor) {
        Reservation reservation = findReservation(reservationId);
        Program program = programOf(reservation);
        platformAccessGuard.verify(program.getPlatformId(), actor);

        reservation.markNoShow();
        UserPass userPass = userPassRepository.findById(reservation.getUserPassId())
                .orElseThrow(() -> new IllegalArgumentException("User pass not found"));
        userPass.useSession();

        outboxEventRepository.save(OutboxEvent.of(
                "RESERVATION", reservation.getId(), "reservation.no_show", "reservehub.reservation",
                Map.of("reservationId", reservation.getId().toString(), "userId", reservation.getUserId().toString())
        ));

        return reservation;
    }

    private Program programOf(Reservation reservation) {
        Slot slot = slotRepository.findById(reservation.getSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        return programRepository.findById(slot.getProgramId())
                .orElseThrow(() -> new IllegalArgumentException("Program not found"));
    }

    private Reservation findReservation(UUID reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
    }

    private static DayOfWeek toDomainDayOfWeek(LocalDate date) {
        return DayOfWeek.values()[date.getDayOfWeek().getValue() - 1];
    }
}
