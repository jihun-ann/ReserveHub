package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.reservation.Reservation;
import com.hub.reservehub.domain.reservation.ReservationService;
import com.hub.reservehub.domain.reservation.ReservationStatus;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ReservationController {

    private final ReservationService reservationService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public ReservationController(ReservationService reservationService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.reservationService = reservationService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/slots/{slotId}/reservations")
    public ResponseEntity<ReservationResponse> create(@PathVariable UUID slotId, @Valid @RequestBody CreateReservationRequest request) {
        Reservation reservation = reservationService.create(
                slotId, currentAuthenticatedUser.get(), request.scheduledDate(), request.userPassId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ReservationResponse.from(reservation));
    }

    @GetMapping("/api/v1/users/me/reservations")
    public List<ReservationResponse> myReservations() {
        return reservationService.myReservations(currentAuthenticatedUser.get()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/slots/{slotId}/reservations")
    public List<ReservationResponse> listForSlot(
            @PathVariable UUID slotId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return reservationService.listForSlot(slotId, date, currentAuthenticatedUser.get()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @PostMapping("/api/v1/reservations/{id}/cancel")
    public ReservationResponse cancel(@PathVariable UUID id, @RequestBody(required = false) CancelReservationRequest request) {
        String reason = request != null ? request.reason() : null;
        return ReservationResponse.from(reservationService.cancel(id, currentAuthenticatedUser.get(), reason));
    }

    @PostMapping("/api/v1/reservations/{id}/no-show")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    public ReservationResponse markNoShow(@PathVariable UUID id) {
        return ReservationResponse.from(reservationService.markNoShow(id, currentAuthenticatedUser.get()));
    }

    public record CreateReservationRequest(@NotNull LocalDate scheduledDate, @NotNull UUID userPassId) {
    }

    public record CancelReservationRequest(String reason) {
    }

    public record ReservationResponse(
            UUID id, UUID userId, UUID slotId, UUID userPassId, LocalDate scheduledDate,
            ReservationStatus status, Instant cancelledAt, String cancelReason
    ) {
        public static ReservationResponse from(Reservation reservation) {
            return new ReservationResponse(
                    reservation.getId(), reservation.getUserId(), reservation.getSlotId(), reservation.getUserPassId(),
                    reservation.getScheduledDate(), reservation.getStatus(), reservation.getCancelledAt(), reservation.getCancelReason()
            );
        }
    }
}
