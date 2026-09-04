package com.hub.reservehub.domain.pass;

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
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "CREATE", null));
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
    public void deactivate(UUID passId, AuthenticatedUser actor) {
        Pass pass = findPass(passId);
        platformAccessGuard.verifyRole(pass.getPlatformId(), actor, StaffRole.MANAGER);
        pass.deactivate();
        actionLogRepository.save(ActionLog.of(pass.getPlatformId(), actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "DEACTIVATE", null));
    }

    private Pass findPass(UUID passId) {
        return passRepository.findById(passId)
                .orElseThrow(() -> new IllegalArgumentException("Pass not found"));
    }
}
