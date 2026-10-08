package com.hub.reservehub.domain.user;

/**
 * 인증 코드를 실제로 보내는 수단 — 이메일(SMTP)/문자(SMS) 연동 시 이 인터페이스 구현을 추가한다.
 * 연동 전에는 LoggingVerificationSender가 코드를 서버 로그에만 남긴다(개발용).
 */
public interface VerificationSender {
    void send(VerificationChannel channel, String target, String code);
}
