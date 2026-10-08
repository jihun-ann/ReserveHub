package com.hub.reservehub.domain.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발용 발송기 — 이메일/SMS가 연결돼 있지 않아 인증 코드를 서버 로그에만 출력한다. 사용자에게는 전달되지 않는다.
 * 실제 발송 구현을 만들면 app.verification.sender 값을 바꿔(예: smtp) 이 빈을 끈다. 운영에서는 쓰지 말 것.
 */
@Component
@ConditionalOnProperty(name = "app.verification.sender", havingValue = "log", matchIfMissing = true)
public class LoggingVerificationSender implements VerificationSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingVerificationSender.class);

    @Override
    public void send(VerificationChannel channel, String target, String code) {
        log.warn("[인증 코드 - 개발용 로그 발송] {} {} → {}", channel, target, code);
    }
}
