package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 오너/매니저의 모든 처리 이력(승인·반려·변경·등록 등)을 언제 누가 했는지 조회한다 (AGENT.md 4-2, 4-4).
 * 오너의 플랫폼 관리 화면, 매니저 본인 관리 화면 양쪽에서 사용된다.
 */
@Service
public class ActionLogService {

    private final ActionLogRepository actionLogRepository;
    private final UserRepository userRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public ActionLogService(ActionLogRepository actionLogRepository, UserRepository userRepository, PlatformAccessGuard platformAccessGuard) {
        this.actionLogRepository = actionLogRepository;
        this.userRepository = userRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional(readOnly = true)
    public List<Entry> list(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyRole(platformId, actor, StaffRole.MANAGER);
        List<ActionLog> logs = actionLogRepository.findByPlatformIdOrderByCreatedAtDesc(platformId);
        Map<UUID, User> actorsById = userRepository.findAllById(logs.stream().map(ActionLog::getActorId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return logs.stream().map(log -> new Entry(log, actorsById.get(log.getActorId()))).toList();
    }

    public record Entry(ActionLog log, User actor) {
    }
}
