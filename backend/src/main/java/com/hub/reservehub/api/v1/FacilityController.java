package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.facility.Facility;
import com.hub.reservehub.domain.facility.FacilityBooking;
import com.hub.reservehub.domain.facility.FacilityBookingStatus;
import com.hub.reservehub.domain.facility.FacilityIssue;
import com.hub.reservehub.domain.facility.FacilityIssueStatus;
import com.hub.reservehub.domain.facility.FacilityService;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class FacilityController {

    private final FacilityService facilityService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public FacilityController(FacilityService facilityService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.facilityService = facilityService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/facilities")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<FacilityResponse> create(@PathVariable UUID platformId, @Valid @RequestBody CreateFacilityRequest request) {
        Facility facility = facilityService.create(platformId, currentAuthenticatedUser.get(), request.name(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(FacilityResponse.from(facility));
    }

    @GetMapping("/api/v1/platforms/{platformId}/facilities")
    public List<FacilityResponse> list(@PathVariable UUID platformId) {
        return facilityService.list(platformId).stream().map(FacilityResponse::from).toList();
    }

    @PatchMapping("/api/v1/facilities/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public FacilityResponse update(@PathVariable UUID id, @Valid @RequestBody CreateFacilityRequest request) {
        return FacilityResponse.from(facilityService.update(id, currentAuthenticatedUser.get(), request.name(), request.description()));
    }

    @DeleteMapping("/api/v1/facilities/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        facilityService.deactivate(id, currentAuthenticatedUser.get());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/facilities/{id}/bookings")
    public ResponseEntity<FacilityBookingResponse> book(@PathVariable UUID id, @Valid @RequestBody CreateBookingRequest request) {
        FacilityBooking booking = facilityService.book(
                id, currentAuthenticatedUser.get(), request.bookingDate(), request.startTime(), request.endTime(), request.purpose()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(FacilityBookingResponse.from(booking));
    }

    @GetMapping("/api/v1/platforms/{platformId}/facility-bookings")
    public List<FacilityBookingResponse> listBookingsForPlatform(
            @PathVariable UUID platformId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return facilityService.listBookingsForPlatform(platformId, currentAuthenticatedUser.get(), date).stream()
                .map(FacilityBookingResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/facility-bookings/mine")
    public List<FacilityBookingResponse> myBookings() {
        return facilityService.myBookings(currentAuthenticatedUser.get()).stream().map(FacilityBookingResponse::from).toList();
    }

    @PostMapping("/api/v1/facility-bookings/{id}/cancel")
    public FacilityBookingResponse cancelBooking(@PathVariable UUID id) {
        return FacilityBookingResponse.from(facilityService.cancelBooking(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/facilities/{id}/issues")
    public ResponseEntity<FacilityIssueResponse> reportIssue(@PathVariable UUID id, @Valid @RequestBody ReportIssueRequest request) {
        FacilityIssue issue = facilityService.reportIssue(id, currentAuthenticatedUser.get(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(FacilityIssueResponse.from(issue));
    }

    @GetMapping("/api/v1/platforms/{platformId}/facility-issues")
    public List<FacilityIssueResponse> listIssues(@PathVariable UUID platformId) {
        return facilityService.listIssues(platformId, currentAuthenticatedUser.get()).stream()
                .map(FacilityIssueResponse::from)
                .toList();
    }

    @PostMapping("/api/v1/facility-issues/{id}/in-progress")
    public FacilityIssueResponse markIssueInProgress(@PathVariable UUID id) {
        return FacilityIssueResponse.from(facilityService.markIssueInProgress(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/facility-issues/{id}/resolve")
    public FacilityIssueResponse resolveIssue(@PathVariable UUID id, @RequestBody(required = false) ResolveIssueRequest request) {
        String memo = request != null ? request.resolutionMemo() : null;
        return FacilityIssueResponse.from(facilityService.resolveIssue(id, currentAuthenticatedUser.get(), memo));
    }

    public record CreateFacilityRequest(@NotBlank String name, String description) {
    }

    public record CreateBookingRequest(
            @NotNull LocalDate bookingDate, @NotNull LocalTime startTime, @NotNull LocalTime endTime, String purpose
    ) {
    }

    public record ReportIssueRequest(@NotBlank String description) {
    }

    public record ResolveIssueRequest(String resolutionMemo) {
    }

    public record FacilityResponse(UUID id, UUID platformId, String name, String description, boolean isActive) {
        public static FacilityResponse from(Facility facility) {
            return new FacilityResponse(facility.getId(), facility.getPlatformId(), facility.getName(), facility.getDescription(), facility.isActive());
        }
    }

    public record FacilityBookingResponse(
            UUID id, UUID facilityId, UUID platformId, UUID userId, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime, String purpose, FacilityBookingStatus status
    ) {
        public static FacilityBookingResponse from(FacilityBooking booking) {
            return new FacilityBookingResponse(
                    booking.getId(), booking.getFacilityId(), booking.getPlatformId(), booking.getUserId(), booking.getBookingDate(),
                    booking.getStartTime(), booking.getEndTime(), booking.getPurpose(), booking.getStatus()
            );
        }
    }

    public record FacilityIssueResponse(
            UUID id, UUID facilityId, UUID platformId, UUID reportedBy, String description, FacilityIssueStatus status,
            UUID resolvedBy, Instant resolvedAt, String resolutionMemo, Instant createdAt
    ) {
        public static FacilityIssueResponse from(FacilityIssue issue) {
            return new FacilityIssueResponse(
                    issue.getId(), issue.getFacilityId(), issue.getPlatformId(), issue.getReportedBy(), issue.getDescription(),
                    issue.getStatus(), issue.getResolvedBy(), issue.getResolvedAt(), issue.getResolutionMemo(), issue.getCreatedAt()
            );
        }
    }
}
