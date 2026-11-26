package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.approval.ActionLogger;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.program.ProgramService;
import com.hub.reservehub.domain.program.ProgramService.ProgramSpec;
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
    private final ActionLogger actionLogger;
    private final ProgramService programService;

    public PassService(
            PassRepository passRepository, PlatformAccessGuard platformAccessGuard, ActionLogger actionLogger, ProgramService programService
    ) {
        this.passRepository = passRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogger = actionLogger;
        this.programService = programService;
    }

    @Transactional
    // 수강권 화면의 저장 — 수강권과 그 수업 설정(프로그램)을 한 트랜잭션으로 저장한다. 프로그램 저장이 실패하면
    // 수강권도 되돌려져서, "수강권만 생기고 다시 누르면 중복" 되는 일이 없다.
    public Pass createWithProgram(
            UUID platformId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays, @Nullable ProgramSpec program
    ) {
        Pass pass = create(platformId, actor, name, type, price, sessionCount, validDays);
        if (program != null) {
            programService.saveForPass(pass, actor, program);
        }
        return pass;
    }

    @Transactional
    public Pass updateWithProgram(
            UUID passId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays, @Nullable ProgramSpec program
    ) {
        Pass pass = update(passId, actor, name, type, price, sessionCount, validDays);
        if (program != null) {
            programService.saveForPass(pass, actor, program);
        }
        return pass;
    }

    @Transactional
    public Pass create(
            UUID platformId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays
    ) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_PAYMENT);
        Pass pass = passRepository.save(new Pass(platformId, name, type, price, sessionCount, validDays));
        actionLogger.log(platformId, actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "CREATE",
                "수강권 등록: '" + name + "' (" + type + ", " + LogMemo.won(price) + (sessionCount != null ? ", " + sessionCount + "회" : "") + ", 유효 " + validDays + "일)");
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
        return passRepository.getOrThrow(passId);
    }

    @Transactional
    public Pass update(
            UUID passId, AuthenticatedUser actor, String name, PassType type,
            int price, @Nullable Short sessionCount, short validDays
    ) {
        Pass pass = passRepository.getOrThrow(passId);
        platformAccessGuard.verifyManagerPermission(pass.getPlatformId(), actor, ManagerPermission.MENU_PAYMENT);
        String changes = LogMemo.changes(
                LogMemo.change("이름", pass.getName(), name),
                LogMemo.change("유형", pass.getType(), type),
                LogMemo.change("가격", LogMemo.won(pass.getPrice()), LogMemo.won(price)),
                LogMemo.change("횟수", pass.getSessionCount(), sessionCount),
                LogMemo.change("유효일", pass.getValidDays(), validDays)
        );
        pass.update(name, type, price, sessionCount, validDays);
        actionLogger.log(pass.getPlatformId(), actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "UPDATE",
                "수강권 수정: '" + pass.getName() + "' — " + changes);
        return pass;
    }

    @Transactional
    public void deactivate(UUID passId, AuthenticatedUser actor) {
        Pass pass = passRepository.getOrThrow(passId);
        platformAccessGuard.verifyManagerPermission(pass.getPlatformId(), actor, ManagerPermission.MENU_PAYMENT);
        pass.deactivate();
        actionLogger.log(pass.getPlatformId(), actor.getId(), ActionTarget.PASS_CHANGE, pass.getId(), "DEACTIVATE",
                "수강권 비활성화: '" + pass.getName() + "'");
    }
}
