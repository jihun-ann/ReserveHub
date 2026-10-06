package com.hub.reservehub.config;

import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.approval.FinancialRequestService;
import com.hub.reservehub.domain.approval.FinancialRequestType;
import com.hub.reservehub.domain.approval.ScheduleChangeRequest;
import com.hub.reservehub.domain.approval.ScheduleChangeRequestRepository;
import com.hub.reservehub.domain.approval.ScheduleChangeRequestService;
import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.ManagerTier;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.domain.platform.PlatformService;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.platform.TaxAccountantService;
import com.hub.reservehub.domain.program.DayOfWeek;
import com.hub.reservehub.domain.program.EnrollmentMode;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramService;
import com.hub.reservehub.domain.program.ProgramType;
import com.hub.reservehub.domain.program.Slot;
import com.hub.reservehub.domain.calendar.CalendarEventService;
import com.hub.reservehub.domain.calendar.EventType;
import com.hub.reservehub.domain.calendar.ShareScope;
import com.hub.reservehub.domain.facility.Facility;
import com.hub.reservehub.domain.facility.FacilityService;
import com.hub.reservehub.domain.lesson.AttendStatus;
import com.hub.reservehub.domain.lesson.Lesson;
import com.hub.reservehub.domain.lesson.LessonService;
import com.hub.reservehub.domain.pass.CashReceiptStatus;
import com.hub.reservehub.domain.pass.DiscountPolicy;
import com.hub.reservehub.domain.pass.DiscountPolicyService;
import com.hub.reservehub.domain.pass.DiscountType;
import com.hub.reservehub.domain.pass.OrderService;
import com.hub.reservehub.domain.pass.PaymentMethod;
import com.hub.reservehub.domain.pass.Pass;
import com.hub.reservehub.domain.pass.PassService;
import com.hub.reservehub.domain.pass.PassType;
import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.reservation.Reservation;
import com.hub.reservehub.domain.reservation.ReservationService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds one test account per role plus a platform linking them, so the frontend can be
 * exercised end-to-end against the local H2 datasource configured in application.properties.
 *
 * postgres 프로필(실제 DB)에서는 돌지 않는다 — 매 기동마다 무조건 재삽입이라 영구 DB에서는 재시작할
 * 때마다 중복 키 충돌로 깨진다. 실 DB엔 OwnerSeeder가 대신 최소 계정만 한 번 심는다.
 */
@Component
@Profile("!postgres")
public class DummyDataSeeder implements CommandLineRunner {

    private static final String PASSWORD = "test";

    private final AuthService authService;
    private final PlatformService platformService;
    private final TaxAccountantService taxaccountService;
    private final UserService userService;
    private final ScheduleChangeRequestRepository scheduleChangeRequestRepository;
    private final PassService passService;
    private final UserPassRepository userPassRepository;
    private final OrderService orderService;
    private final DiscountPolicyService discountPolicyService;
    private final CalendarEventService calendarEventService;
    private final ProgramService programService;
    private final LessonService lessonService;
    private final ReservationService reservationService;
    private final ScheduleChangeRequestService scheduleChangeRequestService;
    private final FinancialRequestService financialRequestService;
    private final FacilityService facilityService;

    public DummyDataSeeder(
            AuthService authService, PlatformService platformService,
            TaxAccountantService taxaccountService, UserService userService,
            ScheduleChangeRequestRepository scheduleChangeRequestRepository,
            PassService passService, UserPassRepository userPassRepository,
            OrderService orderService, DiscountPolicyService discountPolicyService,
            CalendarEventService calendarEventService, ProgramService programService,
            LessonService lessonService, ReservationService reservationService,
            ScheduleChangeRequestService scheduleChangeRequestService,
            FinancialRequestService financialRequestService, FacilityService facilityService
    ) {
        this.authService = authService;
        this.platformService = platformService;
        this.taxaccountService = taxaccountService;
        this.userService = userService;
        this.scheduleChangeRequestRepository = scheduleChangeRequestRepository;
        this.passService = passService;
        this.userPassRepository = userPassRepository;
        this.orderService = orderService;
        this.discountPolicyService = discountPolicyService;
        this.calendarEventService = calendarEventService;
        this.programService = programService;
        this.lessonService = lessonService;
        this.reservationService = reservationService;
        this.scheduleChangeRequestService = scheduleChangeRequestService;
        this.financialRequestService = financialRequestService;
        this.facilityService = facilityService;
    }

    @Override
    public void run(String... args) {
        System.out.println("[DummyDataSeeder] seeding start");
        User owner = authService.register("owner", "owner@test.com", PASSWORD, Role.OWNER, "김도윤", "010-1111-2222");
        User manager = authService.register("manager", "manager@test.com", PASSWORD, Role.MANAGER, "이서연", "010-2222-3333");
        // 매니저 등급(L/M/H) 데모용 — manager@test.com은 HIGH로 기존 시나리오를 그대로 유지하고,
        // 등급별 차이를 눈으로 볼 수 있도록 MEDIUM/LOW 매니저 계정을 추가로 둔다.
        User managerMid = authService.register("manager_mid", "manager-mid@test.com", PASSWORD, Role.MANAGER, "정하윤", "010-2222-4444");
        User managerJunior = authService.register("manager_low", "manager-low@test.com", PASSWORD, Role.MANAGER, "오지훈", "010-2222-5555");
        User tutor = authService.register("tutor", "tutor@test.com", PASSWORD, Role.TUTOR, "박지훈", "010-3333-4444");
        User user = authService.register("user", "user@test.com", PASSWORD, Role.USER, "최민서", "010-4444-5555");

        // 세무사가 조회할 정산 계좌 — 실제 서비스에선 본인이 마이페이지에서 등록하지만, 더미데이터는
        // 미리 채워둬서 세무사 계정 시드 즉시 "직원 정보" 화면에 값이 보이도록 한다.
        userService.updateBankInfo(manager.getId(), "국민은행", "110-234-567890", manager.getName());
        userService.updateBankInfo(tutor.getId(), "신한은행", "110-345-678901", tutor.getName());

        AuthenticatedUser ownerPrincipal = AuthenticatedUser.from(owner);
        Platform platform = platformService.create(
                ownerPrincipal, "ReserveHub 테스트 스튜디오", BusinessType.FITNESS,
                "02-1234-5678", "서울시 강남구", "더미 데이터용 테스트 플랫폼"
        );
        platformService.assignStaff(platform.getId(), ownerPrincipal, manager.getId(), StaffRole.MANAGER, ManagerTier.HIGH);
        platformService.assignStaff(platform.getId(), ownerPrincipal, managerMid.getId(), StaffRole.MANAGER, ManagerTier.MEDIUM);
        platformService.assignStaff(platform.getId(), ownerPrincipal, managerJunior.getId(), StaffRole.MANAGER, ManagerTier.LOW);
        platformService.assignStaff(platform.getId(), ownerPrincipal, tutor.getId(), StaffRole.TUTOR);
        seedScheduleChangeRequests(platform.getId(), tutor.getId(), manager.getId());
        MembersAndPass seeded = seedMembers(platform.getId(), ownerPrincipal);
        List<User> members = seeded.members();
        seedCalendarEvents(platform.getId(), ownerPrincipal);
        Slot slot = seedLessonsForSlot(platform.getId(), ownerPrincipal, seeded.pass().getId(), "그룹반 A", DayOfWeek.MON, tutor.getId(), members);
        seedReservationAndRequest(platform.getId(), ownerPrincipal, tutor, slot, members.get(0), "수강생 요청으로 다음 그룹반 일정을 조정합니다.");
        seedFacilities(platform.getId(), ownerPrincipal, user);

        // tutor@test.com이 자신이 강사로 소속된 플랫폼에서 동시에 수강권을 구매한 고객이기도 한
        // 시나리오 — 한 플랫폼 안에서 스태프이면서 사용자인 다중 역할 케이스를 재현한다.
        AuthenticatedUser tutorPrincipal = AuthenticatedUser.from(tutor);
        Pass tutorOwnPass = passService.list(platform.getId()).get(0);
        var tutorOrder = orderService.createOrder(
                platform.getId(), tutorPrincipal, tutor.getId(),
                List.of(new OrderService.PassSelection(tutorOwnPass.getId(), (short) 1, null, null, null, null)), List.of(), null
        );
        orderService.pay(tutorOrder.getId(), tutorPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);

        // manager@test.com도 같은 테스트 스튜디오에서 수강권을 구매한 고객이기도 한 시나리오 —
        // MANAGER(관리자)+USER(사용자) 멀티롤 케이스를 테스트 스튜디오에서 재현한다.
        AuthenticatedUser managerPrincipal = AuthenticatedUser.from(manager);
        Pass managerOwnPass = passService.list(platform.getId()).get(0);
        var managerOrder = orderService.createOrder(
                platform.getId(), managerPrincipal, manager.getId(),
                List.of(new OrderService.PassSelection(managerOwnPass.getId(), (short) 1, null, null, null, null)), List.of(), null
        );
        orderService.pay(managerOrder.getId(), managerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);

        // 같은 owner가 소유한 플랫폼이 여러 개일 때의 목록/전환 UI를 테스트하기 위한 추가 플랫폼.
        // 강사는 두 플랫폼(필라테스 스튜디오 + 요가 스튜디오)에 동시 소속되어 요일이 겹치지 않는
        // 고정 주간 시간표를 테스트할 수 있다.
        Platform platform2 = platformService.create(
                ownerPrincipal, "홍대 요가 스튜디오", BusinessType.FITNESS,
                "02-2345-6789", "서울시 마포구", "더미 데이터용 테스트 플랫폼 2"
        );
        platformService.assignStaff(platform2.getId(), ownerPrincipal, tutor.getId(), StaffRole.TUTOR);
        MembersAndPass seeded2 = seedSimpleMembers(platform2.getId(), ownerPrincipal);
        List<User> members2 = seeded2.members();
        Slot slot2 = seedLessonsForSlot(platform2.getId(), ownerPrincipal, seeded2.pass().getId(), "요가 기초반", DayOfWeek.WED, tutor.getId(), members2);
        seedReservationAndRequest(platform2.getId(), ownerPrincipal, tutor, slot2, members2.get(0), "수강생 사정으로 요가 기초반 일정을 조정합니다.");

        // manager@test.com은 여기서 매니저가 아니라 강사(TUTOR)로, tutor@test.com은 반대로
        // 매니저(MANAGER)로 배정된 세 번째 플랫폼 — 같은 계정이 플랫폼마다 다른 역할을 가지는
        // 시나리오를 두 계정 모두에서 재현해, 강사/매니저 역할이 겹치는 케이스를 양쪽 계정으로 테스트할 수 있다.
        Platform platform3 = platformService.create(
                ownerPrincipal, "잠실 댄스 아카데미", BusinessType.ARTS,
                "02-3456-7890", "서울시 송파구", "더미 데이터용 테스트 플랫폼 3"
        );
        platformService.assignStaff(platform3.getId(), ownerPrincipal, manager.getId(), StaffRole.TUTOR);
        platformService.assignStaff(platform3.getId(), ownerPrincipal, tutor.getId(), StaffRole.MANAGER);

        seedMultiRoleAccount(platform.getId(), platform2.getId(), platform3.getId(), ownerPrincipal);

        // 세무사는 오너가 명시적으로 초대한 플랫폼만 본다 — 잠실 댄스 아카데미는 일부러 초대하지
        // 않아서, "계약 안 한 플랫폼은 안 보임"이 그대로 재현되도록 한다.
        User taxAccountant = taxaccountService.grant(
                platform.getId(), ownerPrincipal, "taxaccount", "taxaccount@test.com", PASSWORD, "오세무", "010-1234-5678"
        );
        taxaccountService.grant(
                platform2.getId(), ownerPrincipal, "taxaccount", "taxaccount@test.com", PASSWORD, "오세무", "010-1234-5678"
        );

        seedFinancialRequests(platform.getId(), taxAccountant, managerPrincipal);
    }

    // 세무사가 등록한 재무 일정(월급날/지출일/명세서 제출일) 예시 — 하나는 매니저가 이미 승인한 상태로,
    // 다른 하나는 대기 중인 상태로 만들어 승인 관리/활동 이력 화면을 바로 확인할 수 있게 한다.
    private void seedFinancialRequests(UUID platformId, User taxAccountant, AuthenticatedUser managerPrincipal) {
        AuthenticatedUser taxAccountantPrincipal = AuthenticatedUser.from(taxAccountant);

        var payday = financialRequestService.create(
                platformId, taxAccountantPrincipal, FinancialRequestType.PAYDAY,
                "8월 급여 지급일", LocalDate.now().withDayOfMonth(25), "급여 이체 예정일입니다."
        );
        financialRequestService.approve(payday.getId(), managerPrincipal, "확인했습니다. 예정대로 진행합니다.");

        financialRequestService.create(
                platformId, taxAccountantPrincipal, FinancialRequestType.STATEMENT,
                "부가세 신고 자료 제출", LocalDate.now().plusDays(10), "신고 전 정산 자료 확인 부탁드립니다."
        );
    }

    // 플랫폼마다 역할 조합이 다른 계정 하나로 셸의 멀티 역할 메뉴/플랫폼 전환 버튼을 골고루 확인하기
    // 위한 전용 테스트 계정 — 테스트 스튜디오는 수강생만, 홍대 요가는 매니저+강사를 동시에(같은
    // 플랫폼에서 두 StaffRole을 동시에 갖는 케이스), 잠실 댄스는 수강생+강사를 동시에 가진다.
    private void seedMultiRoleAccount(UUID platform1Id, UUID platform2Id, UUID platform3Id, AuthenticatedUser ownerPrincipal) {
        User multiRole = authService.register("multirole", "multirole@test.com", PASSWORD, Role.USER, "한다중", "010-0000-1111");

        Pass studioPass = passService.list(platform1Id).get(0);
        var studioOrder = orderService.createOrder(
                platform1Id, ownerPrincipal, multiRole.getId(),
                List.of(new OrderService.PassSelection(studioPass.getId(), (short) 1, null, null, null, null)), List.of(), null
        );
        orderService.pay(studioOrder.getId(), ownerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);

        platformService.assignStaff(platform2Id, ownerPrincipal, multiRole.getId(), StaffRole.MANAGER);
        platformService.assignStaff(platform2Id, ownerPrincipal, multiRole.getId(), StaffRole.TUTOR);

        Pass dancePass = passService.create(
                platform3Id, ownerPrincipal, "댄스 월정액", PassType.MONTHLY, 130000, null, (short) 30
        );
        platformService.assignStaff(platform3Id, ownerPrincipal, multiRole.getId(), StaffRole.TUTOR);
        var dancePassOrder = orderService.createOrder(
                platform3Id, ownerPrincipal, multiRole.getId(),
                List.of(new OrderService.PassSelection(dancePass.getId(), (short) 1, null, null, null, null)), List.of(), null
        );
        orderService.pay(dancePassOrder.getId(), ownerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);
    }

    // reservationId/originalSlot은 실제 예약 없이 승인 관리 화면을 테스트하기 위한 더미 UUID (FK 강제 없음).
    private void seedScheduleChangeRequests(UUID platformId, UUID tutorId, UUID managerId) {
        LocalDate today = LocalDate.now();

        ScheduleChangeRequest pending1 = new ScheduleChangeRequest(
                platformId, tutorId, UUID.randomUUID(), today.plusDays(2),
                UUID.randomUUID(), today.plusDays(5), UUID.randomUUID(), "수강생 개인 사정으로 인한 일정 조정 요청입니다."
        );
        ScheduleChangeRequest pending2 = new ScheduleChangeRequest(
                platformId, tutorId, UUID.randomUUID(), today.plusDays(3),
                UUID.randomUUID(), today.plusDays(4), UUID.randomUUID(), "강사 일정으로 인한 수업 조정 요청입니다."
        );
        ScheduleChangeRequest approved = new ScheduleChangeRequest(
                platformId, tutorId, UUID.randomUUID(), today.minusDays(3),
                UUID.randomUUID(), today.minusDays(1), UUID.randomUUID(), "수강생 요청으로 인한 일정 변경입니다."
        );
        approved.approve(managerId, "정상 승인 처리되었습니다.");
        ScheduleChangeRequest rejected = new ScheduleChangeRequest(
                platformId, tutorId, UUID.randomUUID(), today.minusDays(5),
                UUID.randomUUID(), today.minusDays(4), null, "수강생 해외 출장으로 인한 레슨 취소 요청입니다."
        );
        rejected.reject(managerId, "해당 일정으로는 대체 강사 배정이 어려워 반려합니다.");

        scheduleChangeRequestRepository.save(pending1);
        scheduleChangeRequestRepository.save(pending2);
        scheduleChangeRequestRepository.save(approved);
        scheduleChangeRequestRepository.save(rejected);
    }

    // 배치도(2개는 배치, 1개는 미배치)와 예약 현황 화면을 바로 확인할 수 있도록 시설물 2건을
    // user@test.com 명의로 미리 예약해둔다.
    private void seedFacilities(UUID platformId, AuthenticatedUser ownerPrincipal, User user) {
        Facility studioRoom = facilityService.create(
                platformId, ownerPrincipal, "1층 필라테스룸", "리포머 5대 구비", "1층", 2,
                LocalTime.of(9, 0), LocalTime.of(22, 0)
        );
        facilityService.updatePosition(studioRoom.getId(), ownerPrincipal, 25, 40);

        Facility practiceRoom = facilityService.create(
                platformId, ownerPrincipal, "2층 개인연습실", "거울/바 설치", "2층", 1,
                LocalTime.of(9, 0), LocalTime.of(22, 0)
        );
        facilityService.updatePosition(practiceRoom.getId(), ownerPrincipal, 70, 55);

        facilityService.create(
                platformId, ownerPrincipal, "지하 요가룸", null, "지하1층", 4, null, null
        );

        AuthenticatedUser userPrincipal = AuthenticatedUser.from(user);
        LocalDate today = LocalDate.now();
        facilityService.book(studioRoom.getId(), userPrincipal, today.plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0), "개인 연습");
        facilityService.book(practiceRoom.getId(), userPrincipal, today.plusDays(2), LocalTime.of(14, 0), LocalTime.of(15, 0), null);
    }

    private record MembersAndPass(List<User> members, Pass pass) {
    }

    private MembersAndPass seedMembers(UUID platformId, AuthenticatedUser ownerPrincipal) {
        Pass groupPass = passService.create(
                platformId, ownerPrincipal, "그룹 월정액", PassType.MONTHLY, 150000, null, (short) 30
        );
        Pass personalPass = passService.create(
                platformId, ownerPrincipal, "개인 10회권", PassType.SESSION, 500000, (short) 10, (short) 60
        );
        // validDays를 짧게 잡아 결제 즉시 "만료 임박" 상태를 자연스럽게 재현한다 (날짜 조작 없이).
        Pass trialPass = passService.create(
                platformId, ownerPrincipal, "체험 3일권", PassType.DAILY, 30000, null, (short) 3
        );

        DiscountPolicy longTermDiscount = discountPolicyService.create(
                platformId, ownerPrincipal, "장기 등록 할인", DiscountType.LONG_TERM, BigDecimal.valueOf(10),
                3, null, null, "3개월 이상 등록 시 10% 할인"
        );

        User member1 = authService.register("member1", "member1@test.com", PASSWORD, Role.USER, "정하은", "010-5555-6666");
        User member2 = authService.register("member2", "member2@test.com", PASSWORD, Role.USER, "강태윤", "010-6666-7777");
        User member3 = authService.register("member3", "member3@test.com", PASSWORD, Role.USER, "윤서아", "010-7777-8888");

        // member1: 할인 없이 그룹 월정액 결제 → 활성 상태.
        var order1 = orderService.createOrder(
                platformId, ownerPrincipal, member1.getId(),
                List.of(new OrderService.PassSelection(groupPass.getId(), (short) 1, null, null, null, null)), List.of(), null
        );
        orderService.pay(order1.getId(), ownerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);

        // member2: 할인 정책을 적용해 체험권 결제 → 만료 임박 상태 + 결제 현황에 할인 내역 노출.
        var order2 = orderService.createOrder(
                platformId, ownerPrincipal, member2.getId(),
                List.of(new OrderService.PassSelection(trialPass.getId(), (short) 1, null, null, null, null)),
                List.of(longTermDiscount.getId()), "장기 등록 할인 적용"
        );
        orderService.pay(order2.getId(), ownerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);

        // member3: 실제 주문 API는 항상 오늘 기준으로 시작일을 잡기 때문에 과거에 만료된 건은
        // 재현할 수 없다 — 만료 상태 화면 테스트용으로 UserPass만 직접 과거 날짜로 만든다
        // (orderItemId는 대응하는 주문이 없는 더미 UUID라 결제 현황 목록엔 나타나지 않는다).
        LocalDate today = LocalDate.now();
        userPassRepository.save(new UserPass(
                member3.getId(), UUID.randomUUID(), personalPass.getId(), platformId, 5, today.minusDays(90), today.minusDays(10)
        ));

        return new MembersAndPass(List.of(member1, member2, member3), groupPass);
    }

    private void seedCalendarEvents(UUID platformId, AuthenticatedUser ownerPrincipal) {
        LocalDate today = LocalDate.now();
        calendarEventService.create(
                platformId, ownerPrincipal, EventType.SHARED, "그룹반 A 정기 공지",
                "이번 주 그룹반 시간표 변경 안내", today.plusDays(2), null, true, ShareScope.PLATFORM
        );
        calendarEventService.create(
                platformId, ownerPrincipal, EventType.NOTICE, "플랫폼 휴관일",
                "시설 점검으로 하루 휴관합니다", today.plusDays(5), null, true, ShareScope.PLATFORM
        );
        // platformId == null: 전사 공지, OWNER만 생성 가능.
        calendarEventService.create(
                null, ownerPrincipal, EventType.HQ_NOTICE, "본사 정책 공지",
                "전 플랫폼 공통 정책 업데이트 안내", today.plusDays(3), null, true, ShareScope.INCLUDE_OWNER
        );
    }

    // 출결의 reservationId는 null로 남긴다 — 세션 차감 로직은 실제 예약이 있을 때만 타므로
    // 예약 체인 없이도 출결 이력만 안전하게 재현할 수 있다.
    // 슬롯 요일마다 이번 달 전체에 걸쳐 수업을 생성해 캘린더/고정 시간표가 매주 반복되는 패턴을 보여주도록 한다.
    private Slot seedLessonsForSlot(
            UUID platformId, AuthenticatedUser ownerPrincipal, UUID passId, String slotName,
            DayOfWeek dayOfWeek, UUID tutorId, List<User> members
    ) {
        Program program = programService.create(
                platformId, ownerPrincipal, passId, ProgramType.GROUP, EnrollmentMode.APPLICATION, (short) 8, (short) 60, null
        );
        Slot slot = programService.addSlot(
                program.getId(), ownerPrincipal, slotName, tutorId, dayOfWeek,
                LocalTime.of(9, 0), LocalTime.of(10, 0), LocalDate.now().withDayOfMonth(1).minusMonths(1), null
        );
        java.time.DayOfWeek jdkDayOfWeek = toJavaDayOfWeek(dayOfWeek);

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {
            if (date.getDayOfWeek() != jdkDayOfWeek) continue;
            Lesson lesson = lessonService.create(slot.getId(), ownerPrincipal, date);
            if (date.isBefore(today)) {
                lessonService.start(lesson.getId(), ownerPrincipal);
                lessonService.end(lesson.getId(), ownerPrincipal);
                for (int i = 0; i < members.size(); i++) {
                    AttendStatus status = i == members.size() - 1 ? AttendStatus.ABSENT : AttendStatus.PRESENT;
                    lessonService.recordAttendance(lesson.getId(), ownerPrincipal, members.get(i).getId(), status, null, null);
                }
            }
        }

        return slot;
    }

    private static java.time.DayOfWeek toJavaDayOfWeek(DayOfWeek domain) {
        return java.time.DayOfWeek.MONDAY.plus(domain.ordinal());
    }

    // 강사가 실제로 "일정 변경 요청"을 제출할 수 있음을 보여주기 위해, 진짜 예약 하나와
    // 그 예약을 참조하는 실제 ScheduleChangeRequest를 하나 만들어둔다 (나머지 더미 UUID 기반 요청들과 별개).
    private void seedReservationAndRequest(UUID platformId, AuthenticatedUser ownerPrincipal, User tutor, Slot slot, User member, String reason) {
        UserPass memberPass = userPassRepository.findByUserId(member.getId()).stream()
                .filter(p -> p.getPlatformId().equals(platformId))
                .findFirst()
                .orElseThrow();

        java.time.DayOfWeek jdkDayOfWeek = toJavaDayOfWeek(slot.getDayOfWeek());
        LocalDate nextOccurrence = LocalDate.now();
        while (nextOccurrence.getDayOfWeek() != jdkDayOfWeek) {
            nextOccurrence = nextOccurrence.plusDays(1);
        }

        AuthenticatedUser memberPrincipal = AuthenticatedUser.from(member);
        Reservation reservation = reservationService.create(slot.getId(), memberPrincipal, nextOccurrence, memberPass.getId());

        AuthenticatedUser tutorPrincipal = AuthenticatedUser.from(tutor);
        scheduleChangeRequestService.create(
                platformId, tutorPrincipal, reservation.getId(), nextOccurrence.plusDays(2), null, reason
        );
    }

    // 결제/할인 시나리오 없이, 강사가 두 번째 플랫폼에서도 고정 시간표·출석 화면을 테스트할 수 있도록 회원만 간단히 채운다.
    private MembersAndPass seedSimpleMembers(UUID platformId, AuthenticatedUser ownerPrincipal) {
        Pass yogaPass = passService.create(
                platformId, ownerPrincipal, "요가 월정액", PassType.MONTHLY, 120000, null, (short) 30
        );

        User member4 = authService.register("member4", "member4@test.com", PASSWORD, Role.USER, "전다인", "010-8888-9999");
        User member5 = authService.register("member5", "member5@test.com", PASSWORD, Role.USER, "한서준", "010-9999-0000");
    
        for (User member : List.of(member4, member5)) {
            var order = orderService.createOrder(
                    platformId, ownerPrincipal, member.getId(),
                    List.of(new OrderService.PassSelection(yogaPass.getId(), (short) 1, null, null, null, null)), List.of(), null
            );
            orderService.pay(order.getId(), ownerPrincipal, PaymentMethod.CARD, CashReceiptStatus.NOT_ISSUED, null);
        }

        return new MembersAndPass(List.of(member4, member5), yogaPass);
    }
}
