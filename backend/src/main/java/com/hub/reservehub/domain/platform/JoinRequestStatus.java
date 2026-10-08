package com.hub.reservehub.domain.platform;

public enum JoinRequestStatus {
    PENDING,    // 회원이 신청했고 센터 확인을 기다리는 중
    APPROVED,   // 센터가 승인 — 이후 수강권/프로그램을 등록한다
    REJECTED,   // 센터가 반려
    CANCELLED   // 회원이 스스로 취소
}
