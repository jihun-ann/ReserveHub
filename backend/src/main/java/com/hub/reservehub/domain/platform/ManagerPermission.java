package com.hub.reservehub.domain.platform;

/**
 * 매니저 그룹에 줄 수 있는 권한 — MENU_*는 매니저 화면의 메뉴 노출, 나머지는 실제 기능 실행 권한이다.
 * 오너는 항상 전부 가진다. 권한 검사는 PlatformAccessGuard.verifyManagerPermission. label은 활동 이력 메모용 한글 이름.
 */
public enum ManagerPermission {
    MENU_APPROVAL("승인 관리 메뉴"),
    MENU_MEMBERS("회원 관리 메뉴"),
    MENU_TUTOR("강사 관리 메뉴"),
    MENU_LESSON("수업 관리 메뉴"),
    MENU_FACILITY_STATUS("시설물 현황 메뉴"),
    MENU_PAYMENT("수강권/결제 메뉴"),
    MENU_PAYMENT_HISTORY("결제 이력 메뉴"),
    MENU_CALC("상담 계산툴 메뉴"),
    MENU_HISTORY("수업 이력 메뉴"),
    MENU_ACTIVITY_LOG("활동 이력 메뉴"),

    FACILITY_MANAGE("시설 예약 취소/이슈 처리"),
    PROGRAM_MANAGE("프로그램 운영"),
    TUTOR_MANAGE("강사 초대/삭제"),
    MANAGER_MANAGE("매니저 초대/삭제, 그룹 관리"),
    FINANCIAL_APPROVE("재무요청 승인/반려"),
    LEAVE_APPROVE("휴가요청 승인/반려"),
    DISCOUNT_POLICY("할인정책 관리"),
    REFUND("환불"),
    JOIN_REQUEST_MANAGE("가입 신청 처리");

    private final String label;

    ManagerPermission(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
