package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PassService {

    private final PassRepository passRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public PassService(PassRepository passRepository, PlatformAccessGuard platformAccessGuard, ActionLogRepository actionLogRepository) {
        this.passRepository = passRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public Pass create(
            UUID platformId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays
    ) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        Pass pass = passRepository.save(new Pass(platformId, name, type, price, sessionCount, validDays));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "CREATE",
                "수강권 등록: '" + name + "' (" + type + ", " + LogMemo.won(price) + (sessionCount != null ? ", " + sessionCount + "회" : "") + ", 유효 " + validDays + "일)"));
        return pass;
    }

    @Transactional(readOnly = true)
    // Pass catalogs are public across platforms, same as programs — customers browse before buying.
    // 프로그램과 마찬가지로 수강권 카탈로그도 공개 정보다 — 고객이 구매 전에 둘러본다.
    public List<Pass> list(UUID platformId) {
        return passRepository.findByPlatformIdAndIsActiveTrue(platformId);
    }

    @Transactional(readOnly = true)
    public Pass get(UUID passId) {
        return findPass(passId);
    }

    @Transactional
    public Pass update(
            UUID passId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays
    ) {
        Pass pass = findPass(passId);
        platformAccessGuard.verifyRole(pass.getPlatformId(), actor, StaffRole.MANAGER);
        String changes = LogMemo.changes(
                LogMemo.change("이름", pass.getName(), name),
                LogMemo.change("유형", pass.getType(), type),
                LogMemo.change("가격", LogMemo.won(pass.getPrice()), LogMemo.won(price)),
                LogMemo.change("횟수", pass.getSessionCount(), sessionCount),
                LogMemo.change("유효일", pass.getValidDays(), validDays)
        );
        pass.update(name, type, price, sessionCount, validDays);
        actionLogRepository.save(ActionLog.of(pass.getPlatformId(), actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "UPDATE",
                "수강권 수정: '" + pass.getName() + "' — " + changes));
        return pass;
    }

    @Transactional
    public void deactivate(UUID passId, AuthenticatedUser actor) {
        Pass pass = findPass(passId);
        platformAccessGuard.verifyRole(pass.getPlatformId(), actor, StaffRole.MANAGER);
        pass.deactivate();
        actionLogRepository.save(ActionLog.of(pass.getPlatformId(), actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "DEACTIVATE",
                "수강권 비활성화: '" + pass.getName() + "'"));
    }

    private Pass findPass(UUID passId) {
        return passRepository.findById(passId)
                .orElseThrow(() -> new IllegalArgumentException("Pass not found"));
    }
}
