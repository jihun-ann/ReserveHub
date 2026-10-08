package com.hub.reservehub.domain.platform;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.approval.LogMemo;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원이 플랫폼을 찾아(이름 또는 ID) 가입을 신청하고, 센터가 승인/반려하는 흐름.
 * 승인은 "이 사람을 받겠다"는 뜻일 뿐이고, 어떤 프로그램/수강권을 들을지는 승인 뒤에 센터가 등록한다.
 */
@Service
public class JoinRequestService {

    private static final int MIN_QUERY_LENGTH = 2;

    private final JoinRequestRepository requestRepository;
    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository staffRepository;
    private final UserPassRepository userPassRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final UserService userService;
    private final ActionLogRepository actionLogRepository;

    public JoinRequestService(
            JoinRequestRepository requestRepository, PlatformRepository platformRepository,
            PlatformStaffRepository staffRepository, UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard, UserService userService, ActionLogRepository actionLogRepository
    ) {
        this.requestRepository = requestRepository;
        this.platformRepository = platformRepository;
        this.staffRepository = staffRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.userService = userService;
        this.actionLogRepository = actionLogRepository;
    }

    public record WithUser(JoinRequest request, User user) {
    }

    public record WithPlatform(JoinRequest request, String platformName) {
    }

    // 플랫폼 ID(영문 대문자+숫자 6자리, 대소문자 무관) 또는 이름(일부 일치)으로 운영 중인 플랫폼을 찾는다.
    @Transactional(readOnly = true)
    public List<Platform> search(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < MIN_QUERY_LENGTH) {
            throw new IllegalArgumentException("플랫폼 이름이나 ID를 " + MIN_QUERY_LENGTH + "자 이상 입력하세요.");
        }
        if (q.length() == 6 && q.chars().allMatch(Character::isLetterOrDigit)) {
            var byCode = platformRepository.findByCode(q.toUpperCase()).filter(p -> p.getStatus() == PlatformStatus.ACTIVE);
            if (byCode.isPresent()) {
                return List.of(byCode.get());
            }
        }
        return platformRepository.findTop20ByNameContainingIgnoreCaseAndStatusOrderByName(q, PlatformStatus.ACTIVE);
    }

    @Transactional
    public JoinRequest apply(UUID platformId, AuthenticatedUser actor, @Nullable String message) {
        Platform platform = platformRepository.findById(platformId)
                .filter(p -> p.getStatus() == PlatformStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("가입을 받는 플랫폼이 아닙니다."));
        boolean isOwner = platformRepository.existsByIdAndCreatedBy(platformId, actor.getId());
        if (isOwner || staffRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, actor.getId())) {
            throw new IllegalStateException("이 플랫폼의 운영진은 회원으로 신청할 수 없습니다.");
        }
        boolean alreadyMember = userPassRepository.findByPlatformId(platformId).stream().anyMatch(up -> up.getUserId().equals(actor.getId()));
        if (alreadyMember) {
            throw new IllegalStateException("이미 이 플랫폼의 회원입니다.");
        }
        if (requestRepository.existsByPlatformIdAndUserIdAndStatus(platformId, actor.getId(), JoinRequestStatus.PENDING)) {
            throw new IllegalStateException("이미 신청 중입니다. 센터의 확인을 기다려 주세요.");
        }
        String note = message == null || message.isBlank() ? null : LogMemo.clip(message, 500);
        JoinRequest request = requestRepository.save(new JoinRequest(platformId, actor.getId(), note));
        log(platformId, actor, request.getId(), "JOIN_APPLY", LogMemo.with("가입 신청: " + LogMemo.who(userService.get(actor.getId())), note));
        return request;
    }

    @Transactional(readOnly = true)
    public List<WithPlatform> listMine(AuthenticatedUser actor) {
        List<JoinRequest> mine = requestRepository.findByUserIdOrderByCreatedAtDesc(actor.getId());
        Map<UUID, String> names = platformRepository.findAllById(mine.stream().map(JoinRequest::getPlatformId).distinct().toList())
                .stream().collect(Collectors.toMap(Platform::getId, Platform::getName));
        return mine.stream().map(r -> new WithPlatform(r, names.getOrDefault(r.getPlatformId(), "(삭제된 플랫폼)"))).toList();
    }

    @Transactional
    public void cancel(UUID requestId, AuthenticatedUser actor) {
        JoinRequest request = find(requestId);
        if (!request.getUserId().equals(actor.getId())) {
            throw new IllegalArgumentException("본인의 신청만 취소할 수 있습니다.");
        }
        request.cancel();
        log(request.getPlatformId(), actor, requestId, "JOIN_CANCEL", "가입 신청 취소: " + LogMemo.who(userService.get(actor.getId())));
    }

    // 센터가 볼 목록 — 대기 중 + 승인됐지만 아직 수강권을 등록하지 않았을 수 있는 건(화면에서 걸러낸다).
    @Transactional(readOnly = true)
    public List<WithUser> listForPlatform(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.JOIN_REQUEST_MANAGE);
        List<JoinRequest> requests = requestRepository.findByPlatformIdAndStatusInOrderByCreatedAtDesc(
                platformId, List.of(JoinRequestStatus.PENDING, JoinRequestStatus.APPROVED));
        Map<UUID, User> users = requests.stream().map(JoinRequest::getUserId).distinct()
                .collect(Collectors.toMap(Function.identity(), userService::get));
        return requests.stream().map(r -> new WithUser(r, users.get(r.getUserId()))).toList();
    }

    @Transactional
    public JoinRequest approve(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        JoinRequest request = find(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.JOIN_REQUEST_MANAGE);
        request.approve(actor.getId(), memo);
        log(request.getPlatformId(), actor, requestId, "JOIN_APPROVE",
                LogMemo.with("가입 신청 승인: " + LogMemo.who(userService.get(request.getUserId())), memo));
        return request;
    }

    @Transactional
    public JoinRequest reject(UUID requestId, AuthenticatedUser actor, @Nullable String memo) {
        JoinRequest request = find(requestId);
        platformAccessGuard.verifyManagerPermission(request.getPlatformId(), actor, ManagerPermission.JOIN_REQUEST_MANAGE);
        request.reject(actor.getId(), memo);
        log(request.getPlatformId(), actor, requestId, "JOIN_REJECT",
                LogMemo.with("가입 신청 반려: " + LogMemo.who(userService.get(request.getUserId())), memo));
        return request;
    }

    private JoinRequest find(UUID requestId) {
        return requestRepository.findById(requestId).orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다."));
    }

    private void log(UUID platformId, AuthenticatedUser actor, UUID targetId, String action, String memo) {
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.JOIN_REQUEST, targetId, action, memo));
    }
}
