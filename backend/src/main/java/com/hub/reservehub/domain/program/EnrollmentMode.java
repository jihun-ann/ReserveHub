package com.hub.reservehub.domain.program;

/**
 * GROUP 프로그램에서만 실제로 의미 있는 선택 — 어떤 방식으로 슬롯이 채워지는지를 결정한다.
 * PRIVATE는 항상 FIXED로 취급한다 (Program.isFixedRoster() 참고).
 */
public enum EnrollmentMode {
    FIXED,       // 고정형 — 매니저가 슬롯에 학생을 미리 등록, 매주 자동으로 수업이 잡힘
    APPLICATION  // 신청형 — 학생이 매주 직접 신청(Reservation)해서 채움
}
