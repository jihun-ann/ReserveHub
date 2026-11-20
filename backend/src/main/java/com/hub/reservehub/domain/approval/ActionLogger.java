package com.hub.reservehub.domain.approval;

import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

// 활동 로그 한 줄 남기기 — 서비스마다 actionLogRepository.save(ActionLog.of(...))를 반복하지 않게 한다.
@Component
public class ActionLogger {

    private final ActionLogRepository actionLogRepository;

    public ActionLogger(ActionLogRepository actionLogRepository) {
        this.actionLogRepository = actionLogRepository;
    }

    public void log(
            @Nullable UUID platformId, UUID actorId, ActionTarget target, UUID targetId, String action, @Nullable String memo
    ) {
        actionLogRepository.save(ActionLog.of(platformId, actorId, target, targetId, action, memo));
    }
}
