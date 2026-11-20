package com.hub.reservehub.domain.approval;

import com.hub.reservehub.common.persistence.Lookups;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.PlatformRepository;
import com.hub.reservehub.domain.platform.PlatformStaff;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import com.hub.reservehub.domain.platform.PlatformTaxAccountantRepository;
import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 업무 요청 — 오너·매니저·세무사가 같은 플랫폼의 오너·매니저·세무사에게(자기 자신 포함) 일을 맡긴다.
 * 상태는 담당자만 진행 중/완료로, 요청자만 취소로 바꾼다. 조회·댓글은 그 플랫폼의 오너·매니저·세무사 모두.
 */
@Service
public class WorkRequestService {

    private final WorkRequestRepository workRequestRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogger actionLogger;
    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository staffRepository;
    private final PlatformTaxAccountantRepository taxAccountantRepository;
    private final UserRepository userRepository;

    public WorkRequestService(
            WorkRequestRepository workRequestRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogger actionLogger, PlatformRepository platformRepository,
            PlatformStaffRepository staffRepository, PlatformTaxAccountantRepository taxAccountantRepository,
            UserRepository userRepository
    ) {
        this.platformRepository = platformRepository;
        this.staffRepository = staffRepository;
        this.taxAccountantRepository = taxAccountantRepository;
        this.userRepository = userRepository;
        this.workRequestRepository = workRequestRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogger = actionLogger;
    }

    @Transactional
    public WorkRequest create(
            UUID platformId, AuthenticatedUser actor, UUID assigneeId,
            String title, @Nullable String memo, @Nullable LocalDate dueDate, boolean urgent
    ) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        if (!platformAccessGuard.isOfficeMember(platformId, assigneeId)
                && !staffRepository.existsByPlatformIdAndUserIdAndIsActiveTrue(platformId, assigneeId)) {
            throw new IllegalArgumentException("담당자는 이 플랫폼의 오너, 매니저, 강사, 세무사 중에서 지정해야 합니다.");
        }
        WorkRequest request = new WorkRequest(platformId, actor.getId(), assigneeId, title.trim(), memo, dueDate);
        // 나에게 쓰는 할 일은 긴급 표시가 의미 없다 — 순서는 화살표로 정한다.
        if (urgent && !assigneeId.equals(actor.getId())) {
            request.markUrgent();
        }
        request = workRequestRepository.save(request);
        actionLogger.log(platformId, actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "CREATE",
                "업무 요청 등록: '" + request.getTitle() + "'" + (request.isUrgent() ? " [긴급]" : "")
                        + (dueDate != null ? " (기한 " + dueDate + ")" : ""));
        return request;
    }

    // 내가 나에게 쓴 할 일만 지울 수 있다 — 남과 주고받은 업무 요청은 이력이라 취소만 된다.
    @Transactional
    public void deleteTodo(UUID requestId, AuthenticatedUser actor) {
        WorkRequest request = findViewable(requestId, actor);
        if (!request.getRequestedBy().equals(actor.getId()) || !request.getAssigneeId().equals(actor.getId())) {
            throw new AccessDeniedException("직접 추가한 할 일만 삭제할 수 있습니다.");
        }
        workRequestRepository.delete(request);
    }

    // 요청자가 진행 중인 요청을 긴급으로 올린다.
    @Transactional
    public WorkRequest markUrgent(UUID requestId, AuthenticatedUser actor) {
        WorkRequest request = findViewable(requestId, actor);
        if (!request.getRequestedBy().equals(actor.getId())) {
            throw new AccessDeniedException("요청한 사람만 긴급으로 바꿀 수 있습니다.");
        }
        if (!request.isUrgent()) {
            request.markUrgent();
            actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "URGENT",
                    "업무 요청 '" + request.getTitle() + "' 긴급 요청");
        }
        return request;
    }

    // 담당자가 정한 순서 — ids 순서대로 0,1,2… 내가 담당이 아닌 id나 다른 플랫폼 것은 건너뛴다.
    @Transactional
    public void reorder(UUID platformId, AuthenticatedUser actor, List<UUID> ids) {
        isOfficeOrVerifiedStaff(platformId, actor);
        Map<UUID, WorkRequest> byId = new LinkedHashMap<>();
        workRequestRepository.findAllById(ids).forEach(r -> byId.put(r.getId(), r));
        for (int i = 0; i < ids.size(); i++) {
            WorkRequest r = byId.get(ids.get(i));
            if (r != null && r.getPlatformId().equals(platformId) && r.getAssigneeId().equals(actor.getId())) {
                r.setSortOrder(i);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<WorkRequest> list(UUID platformId, AuthenticatedUser actor) {
        if (isOfficeOrVerifiedStaff(platformId, actor)) {
            return workRequestRepository.findByPlatformIdOrderByCreatedAtDesc(platformId).stream()
                    .filter(r -> !isSomeoneElsesTodo(r, actor))
                    .toList();
        }
        // 강사 등 일반 직원은 자기에게 온 업무만 본다.
        return workRequestRepository.findByPlatformIdAndAssigneeIdOrderByCreatedAtDesc(platformId, actor.getId());
    }

    // 요청자 = 담당자인 개인 할 일은 본인만 본다.
    private static boolean isSomeoneElsesTodo(WorkRequest r, AuthenticatedUser actor) {
        return r.getRequestedBy().equals(r.getAssigneeId()) && !r.getAssigneeId().equals(actor.getId());
    }

    // 한 건을 보거나 댓글·상태를 다룰 수 있는지 — 오너·매니저·세무사, 또는 이 요청의 담당자(강사 포함).
    // 남의 개인 할 일은 오너·매니저라도 못 본다.
    @Transactional(readOnly = true)
    public WorkRequest findViewable(UUID requestId, AuthenticatedUser actor) {
        WorkRequest request = workRequestRepository.getOrThrow(requestId);
        if (isSomeoneElsesTodo(request, actor)) {
            throw new AccessDeniedException("이 업무 요청을 볼 수 없습니다.");
        }
        if (!isOfficeOrVerifiedStaff(request.getPlatformId(), actor)
                && !request.getAssigneeId().equals(actor.getId()) && !request.getRequestedBy().equals(actor.getId())) {
            throw new AccessDeniedException("이 업무 요청을 볼 수 없습니다.");
        }
        return request;
    }

    // 오너·매니저·세무사면 true. 아니면 이 플랫폼의 활성 스태프인지 확인(아니면 예외)하고 false —
    // 세무사는 스태프가 아니라 verify를 못 지나므로 오피스 여부를 먼저 본다.
    private boolean isOfficeOrVerifiedStaff(UUID platformId, AuthenticatedUser actor) {
        if (platformAccessGuard.isOfficeMember(platformId, actor.getId())) {
            return true;
        }
        platformAccessGuard.verify(platformId, actor);
        return false;
    }

    // 담당자가 처음 열어 보면 "확인함"으로 남긴다. 담당자가 아니면 아무 일도 없다.
    @Transactional
    public WorkRequest markRead(UUID requestId, AuthenticatedUser actor) {
        WorkRequest request = findViewable(requestId, actor);
        if (request.getAssigneeId().equals(actor.getId()) && request.markRead()) {
            actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "READ",
                    "업무 요청 '" + request.getTitle() + "' 확인");
        }
        return request;
    }

    // 담당자로 고를 수 있는 사람 — 오너, 활성 매니저, 활성 세무사, 활성 강사 (한 사람이 여러 역할이면 앞의 것 하나로).
    @Transactional(readOnly = true)
    public List<Assignee> assignees(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        Map<UUID, String> roles = new LinkedHashMap<>();
        platformRepository.findById(platformId).ifPresent(p -> roles.put(p.getCreatedBy(), "OWNER"));
        List<PlatformStaff> staff = staffRepository.findByPlatformIdAndIsActiveTrue(platformId);
        staff.stream()
                .filter(s -> s.getStaffRole() == StaffRole.MANAGER)
                .forEach(s -> roles.putIfAbsent(s.getUserId(), "MANAGER"));
        taxAccountantRepository.findByPlatformIdAndIsActiveTrue(platformId)
                .forEach(t -> roles.putIfAbsent(t.getUserId(), "TAX_ACCOUNTANT"));
        staff.stream()
                .filter(s -> s.getStaffRole() == StaffRole.TUTOR)
                .forEach(s -> roles.putIfAbsent(s.getUserId(), "TUTOR"));
        Map<UUID, User> users = Lookups.byId(userRepository.findAllById(roles.keySet()), User::getId);
        return roles.entrySet().stream()
                .map(e -> new Assignee(e.getKey(), users.containsKey(e.getKey()) ? users.get(e.getKey()).getName() : null, e.getValue()))
                .toList();
    }

    public record Assignee(UUID userId, String name, String role) {
    }

    @Transactional
    public WorkRequest changeStatus(UUID requestId, AuthenticatedUser actor, WorkRequestStatus next) {
        WorkRequest request = findViewable(requestId, actor);
        boolean byRequester = next == WorkRequestStatus.CANCELED || next == WorkRequestStatus.REVISION_REQUESTED;
        boolean allowed = byRequester
                ? request.getRequestedBy().equals(actor.getId())
                : next != WorkRequestStatus.REQUESTED && request.getAssigneeId().equals(actor.getId());
        if (!allowed) {
            throw new AccessDeniedException(byRequester ? "요청한 사람만 할 수 있습니다." : "담당자만 상태를 바꿀 수 있습니다.");
        }
        if (next == WorkRequestStatus.REVISION_REQUESTED) {
            request.requestRevision();
        } else {
            request.changeStatus(next);
        }
        actionLogger.log(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), next.name(),
                "업무 요청 '" + request.getTitle() + "' → " + label(next));
        return request;
    }

    private static String label(WorkRequestStatus status) {
        return switch (status) {
            case REQUESTED -> "요청됨";
            case IN_PROGRESS -> "진행 중";
            case DONE -> "완료";
            case CANCELED -> "취소";
            case REVISION_REQUESTED -> "추가 확인 요청";
        };
    }
}
