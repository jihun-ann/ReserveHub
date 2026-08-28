package com.hub.reservehub.domain.pass;

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

    public PassService(PassRepository passRepository, PlatformAccessGuard platformAccessGuard) {
        this.passRepository = passRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    public Pass create(
            UUID platformId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays
    ) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        return passRepository.save(new Pass(platformId, name, type, price, sessionCount, validDays));
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
    }

    private Pass findPass(UUID passId) {
        return passRepository.findById(passId)
                .orElseThrow(() -> new IllegalArgumentException("Pass not found"));
    }
}
