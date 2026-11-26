package com.hub.reservehub.domain.user;

public enum Role {
    OWNER,
    MANAGER,
    TUTOR,
    USER,
    TAX_ACCOUNTANT,
    // 서비스 운영자 — 플랫폼 개설 신청(사업자등록증)을 심사한다. 회원가입으로는 만들 수 없고 기동 시 환경변수로만 생성된다.
    ADMIN
}
