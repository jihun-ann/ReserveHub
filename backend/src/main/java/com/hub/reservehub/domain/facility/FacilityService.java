package com.hub.reservehub.domain.facility;

import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시설물(연습실 등) 등록은 오너 전용 기능 — 컨트롤러의 hasRole('OWNER')와 이 서비스의 platformAccessGuard.verify()
 * (실제 이 플랫폼의 소유자인지)가 함께 검증한다. 예약(booking)은 자기 자신의 몫만 만드는 셀프서비스라
 * 별도 플랫폼 소속 검증이 필요 없다(OrderService/ReservationService의 본인 결제·신청과 동일한 패턴).
 * 고장 신고(issue)는 누구나 등록 가능하고, 상태 변경(보수 처리)은 매니저 이상만 가능하다.
 */
@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final FacilityBookingRepository facilityBookingRepository;
    private final FacilityIssueRepository facilityIssueRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogger actionLogger;

    public FacilityService(
            FacilityRepository facilityRepository, FacilityBookingRepository facilityBookingRepository,
            FacilityIssueRepository facilityIssueRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogger actionLogger
    ) {
        this.facilityRepository = facilityRepository;
        this.facilityBookingRepository = facilityBookingRepository;
        this.facilityIssueRepository = facilityIssueRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogger = actionLogger;
    }

    @Transactional
    public Facility create(
            UUID platformId, AuthenticatedUser actor, String name, @Nullable String description, @Nullable String floor,
            @Nullable Integer capacity, @Nullable LocalTime openTime, @Nullable LocalTime closeTime
    ) {
        platformAccessGuard.verifyOwner(platformId, actor); // 전역 OWNER 역할이 아니라 "이 플랫폼의" 오너인지 확인
        Facility facility = facilityRepository.save(
                new Facility(platformId, name, description, floor, capacity != null ? capacity : 1, openTime, closeTime)
        );
        actionLogger.log(platformId, actor.getId(), ActionTarget.FACILITY_CHANGE, facility.getId(), "CREATE",
                "시설 등록: '" + facility.getName() + "' (정원 " + facility.getCapacity() + "명" + (floor == null || floor.isBlank() ? "" : ", " + floor) + ")");
        return facility;
    }

    @Transactional
    public Facility update(
            UUID facilityId, AuthenticatedUser actor, String name, @Nullable String description, @Nullable String floor,
            @Nullable Integer capacity, @Nullable LocalTime openTime, @Nullable LocalTime closeTime
    ) {
        Facility facility = facilityRepository.getOrThrow(facilityId);
        platformAccessGuard.verifyOwner(facility.getPlatformId(), actor);
        String changes = LogMemo.changes(
                LogMemo.change("이름", facility.getName(), name),
                LogMemo.change("설명", facility.getDescription(), description),
                LogMemo.change("층", facility.getFloor(), floor),
                LogMemo.change("정원", facility.getCapacity(), capacity != null ? capacity : 1),
                LogMemo.change("오픈 시각", facility.getOpenTime(), openTime),
                LogMemo.change("마감 시각", facility.getCloseTime(), closeTime)
        );
        facility.update(name, description, floor, capacity != null ? capacity : 1, openTime, closeTime);
        actionLogger.log(facility.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, facility.getId(), "UPDATE",
                "시설 수정: '" + facility.getName() + "' — " + changes);
        return facility;
    }

    @Transactional
    // 배치도 드래그앤드롭으로 위치만 갱신 — 잦은 호출이라 CREATE/UPDATE 액션 로그는 남기지 않는다.
    public Facility updatePosition(UUID facilityId, AuthenticatedUser actor, int posX, int posY) {
        Facility facility = facilityRepository.getOrThrow(facilityId);
        platformAccessGuard.verifyOwner(facility.getPlatformId(), actor);
        facility.updatePosition(posX, posY);
        return facility;
    }

    @Transactional
    public void deactivate(UUID facilityId, AuthenticatedUser actor) {
        Facility facility = facilityRepository.getOrThrow(facilityId);
        platformAccessGuard.verifyOwner(facility.getPlatformId(), actor);
        facility.deactivate();
        actionLogger.log(facility.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, facility.getId(), "DEACTIVATE",
                "시설 비활성화: '" + facility.getName() + "'");
    }

    @Transactional(readOnly = true)
    // 시설물 목록은 예약 전 누구나 둘러볼 수 있는 공개 정보다 (Program/Pass 카탈로그와 동일한 취급).
    public List<Facility> list(UUID platformId) {
        return facilityRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional
    // 본인 몫의 예약을 직접 생성하는 셀프서비스 — actor가 곧 예약자다.
    public FacilityBooking book(
            UUID facilityId, AuthenticatedUser actor, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime, @Nullable String purpose
    ) {
        // 시설 행을 잠가 같은 시설 예약을 한 줄로 세운다 — 안 그러면 동시 예약이 둘 다 "빈 시간"을 보고 겹쳐 들어간다.
        Facility facility = facilityRepository.getForUpdate(facilityId);
        platformAccessGuard.verifyParticipant(facility.getPlatformId(), actor); // 이 센터 회원/직원만 — 외부인이 시간대를 다 잡아 막지 못하게
        if (!facility.isActive()) {
            throw new IllegalStateException("Facility is not active");
        }
        if (facility.getOpenTime() != null && startTime.isBefore(facility.getOpenTime())
                || facility.getCloseTime() != null && endTime.isAfter(facility.getCloseTime())) {
            throw new IllegalStateException("Outside the facility's available hours");
        }
        // 정원(capacity)만큼 같은 시간대 겹치는 예약을 허용한다 — capacity가 1이면 기존의 독점 예약과 동일하게 동작한다.
        long overlapCount = facilityBookingRepository.findByFacilityIdAndBookingDate(facilityId, bookingDate).stream()
                .filter(b -> b.overlaps(bookingDate, startTime, endTime))
                .count();
        if (overlapCount >= facility.getCapacity()) {
            throw new IllegalStateException("This time slot is fully booked");
        }
        FacilityBooking booking = facilityBookingRepository.save(
                new FacilityBooking(facilityId, facility.getPlatformId(), actor.getId(), bookingDate, startTime, endTime, purpose)
        );
        actionLogger.log(facility.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, booking.getId(), "BOOK",
                "시설 예약: '" + facility.getName() + "' " + bookingDate + " " + startTime + "~" + endTime
                        + (purpose == null || purpose.isBlank() ? "" : " (용도: " + LogMemo.clip(purpose, 60) + ")"));
        return booking;
    }

    @Transactional(readOnly = true)
    // 예약 전 누구나 이 시설물의 해당 날짜 예약 현황(시간대만, 예약자 신원은 비공개)을 확인할 수 있다.
    public List<FacilityBooking> listBookingsForFacility(UUID facilityId, LocalDate date) {
        return facilityBookingRepository.findByFacilityIdAndBookingDate(facilityId, date).stream()
                .filter(b -> b.getStatus() == FacilityBookingStatus.CONFIRMED)
                .toList();
    }

    @Transactional(readOnly = true)
    // 매니저/오너의 현황 조회 — 이 플랫폼 스태프(또는 소유자)만 가능.
    public List<FacilityBooking> listBookingsForPlatform(UUID platformId, AuthenticatedUser actor, LocalDate date) {
        platformAccessGuard.verify(platformId, actor);
        return facilityBookingRepository.findByPlatformIdAndBookingDate(platformId, date);
    }

    @Transactional(readOnly = true)
    public List<FacilityBooking> myBookings(AuthenticatedUser actor) {
        return facilityBookingRepository.findByUserId(actor.getId());
    }

    @Transactional
    public FacilityBooking cancelBooking(UUID bookingId, AuthenticatedUser actor) {
        FacilityBooking booking = facilityBookingRepository.getOrThrow(bookingId);
        if (!booking.getUserId().equals(actor.getId())) {
            platformAccessGuard.verifyManagerPermission(booking.getPlatformId(), actor, ManagerPermission.FACILITY_MANAGE); // 시설 예약 취소(타인): 중간 등급 이상 매니저
        }
        booking.cancel();
        return booking;
    }

    @Transactional
    // 이 센터의 회원/강사/매니저/오너 누구나 고장·이상을 신고할 수 있다.
    public FacilityIssue reportIssue(UUID facilityId, AuthenticatedUser actor, String description) {
        Facility facility = facilityRepository.getOrThrow(facilityId);
        platformAccessGuard.verifyParticipant(facility.getPlatformId(), actor); // 외부인이 남의 센터에 신고를 쌓지 못하게
        FacilityIssue issue = facilityIssueRepository.save(new FacilityIssue(facilityId, facility.getPlatformId(), actor.getId(), description));
        actionLogger.log(facility.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, issue.getId(), "REPORT_ISSUE",
                "시설 고장 신고: '" + facility.getName() + "' — " + LogMemo.clip(description, 150));
        return issue;
    }

    @Transactional(readOnly = true)
    public List<FacilityIssue> listIssues(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verify(platformId, actor);
        return facilityIssueRepository.findByPlatformIdOrderByCreatedAtDesc(platformId);
    }

    @Transactional
    public FacilityIssue markIssueInProgress(UUID issueId, AuthenticatedUser actor) {
        FacilityIssue issue = facilityIssueRepository.getOrThrow(issueId);
        platformAccessGuard.verifyManagerPermission(issue.getPlatformId(), actor, ManagerPermission.FACILITY_MANAGE); // 시설 이슈 처리: 중간 등급 이상 매니저
        issue.markInProgress();
        actionLogger.log(issue.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, issue.getId(), "IN_PROGRESS",
                "시설 이슈 처리 시작: '" + facilityName(issue.getFacilityId()) + "' — " + LogMemo.clip(issue.getDescription(), 100));
        return issue;
    }

    @Transactional
    public FacilityIssue resolveIssue(UUID issueId, AuthenticatedUser actor, @Nullable String resolutionMemo) {
        FacilityIssue issue = facilityIssueRepository.getOrThrow(issueId);
        platformAccessGuard.verifyManagerPermission(issue.getPlatformId(), actor, ManagerPermission.FACILITY_MANAGE); // 시설 이슈 처리: 중간 등급 이상 매니저
        issue.resolve(actor.getId(), resolutionMemo);
        actionLogger.log(issue.getPlatformId(), actor.getId(), ActionTarget.FACILITY_CHANGE, issue.getId(), "RESOLVE",
                LogMemo.with("시설 이슈 해결: '" + facilityName(issue.getFacilityId()) + "' — " + LogMemo.clip(issue.getDescription(), 100), resolutionMemo));
        return issue;
    }

    private String facilityName(UUID facilityId) {
        return facilityRepository.findById(facilityId).map(Facility::getName).orElse("(삭제된 시설)");
    }
}
