package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.PlatformRepository;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import com.hub.reservehub.domain.platform.PlatformTaxAccountantRepository;
import com.hub.reservehub.domain.platform.StaffRole;
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
    private final ActionLogRepository actionLogRepository;
    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository staffRepository;
    private final PlatformTaxAccountantRepository taxAccountantRepository;
    private final UserRepository userRepository;

    public WorkRequestService(
            WorkRequestRepository workRequestRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository, PlatformRepository platformRepository,
            PlatformStaffRepository staffRepository, PlatformTaxAccountantRepository taxAccountantRepository,
            UserRepository userRepository
    ) {
        this.platformRepository = platformRepository;
        this.staffRepository = staffRepository;
        this.taxAccountantRepository = taxAccountantRepository;
        this.userRepository = userRepository;
        this.workRequestRepository = workRequestRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public WorkRequest create(
            UUID platformId, AuthenticatedUser actor, UUID assigneeId,
            String title, @Nullable String memo, @Nullable LocalDate dueDate
    ) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        if (!platformAccessGuard.isOfficeMember(platformId, assigneeId)) {
            throw new IllegalArgumentException("담당자는 이 플랫폼의 오너, 매니저, 세무사 중에서 지정해야 합니다.");
        }
        WorkRequest request = workRequestRepository.save(new WorkRequest(platformId, actor.getId(), assigneeId, title.trim(), memo, dueDate));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), "CREATE",
                "업무 요청 등록: '" + request.getTitle() + "'" + (dueDate != null ? " (기한 " + dueDate + ")" : "")));
        return request;
    }

    @Transactional(readOnly = true)
    public List<WorkRequest> list(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        return workRequestRepository.findByPlatformIdOrderByCreatedAtDesc(platformId);
    }

    // 담당자로 고를 수 있는 사람 — 오너, 활성 매니저, 활성 세무사 (한 사람이 여러 역할이면 앞의 것 하나로).
    @Transactional(readOnly = true)
    public List<Assignee> assignees(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        Map<UUID, String> roles = new LinkedHashMap<>();
        platformRepository.findById(platformId).ifPresent(p -> roles.put(p.getCreatedBy(), "OWNER"));
        staffRepository.findByPlatformIdAndIsActiveTrue(platformId).stream()
                .filter(s -> s.getStaffRole() == StaffRole.MANAGER)
                .forEach(s -> roles.putIfAbsent(s.getUserId(), "MANAGER"));
        taxAccountantRepository.findByPlatformIdAndIsActiveTrue(platformId)
                .forEach(t -> roles.putIfAbsent(t.getUserId(), "TAX_ACCOUNTANT"));
        Map<UUID, String> names = new LinkedHashMap<>();
        userRepository.findAllById(roles.keySet()).forEach(u -> names.put(u.getId(), u.getName()));
        return roles.entrySet().stream()
                .map(e -> new Assignee(e.getKey(), names.get(e.getKey()), e.getValue()))
                .toList();
    }

    public record Assignee(UUID userId, String name, String role) {
    }

    @Transactional
    public WorkRequest changeStatus(UUID requestId, AuthenticatedUser actor, WorkRequestStatus next) {
        WorkRequest request = findRequest(requestId);
        platformAccessGuard.verifyFinancialAccess(request.getPlatformId(), actor);
        boolean allowed = next == WorkRequestStatus.CANCELED
                ? request.getRequestedBy().equals(actor.getId())
                : next != WorkRequestStatus.REQUESTED && request.getAssigneeId().equals(actor.getId());
        if (!allowed) {
            throw new AccessDeniedException(next == WorkRequestStatus.CANCELED
                    ? "요청한 사람만 취소할 수 있습니다." : "담당자만 상태를 바꿀 수 있습니다.");
        }
        request.changeStatus(next);
        actionLogRepository.save(ActionLog.of(request.getPlatformId(), actor.getId(), ActionTarget.FINANCIAL_REQUEST, request.getId(), next.name(),
                "업무 요청 '" + request.getTitle() + "' → " + label(next)));
        return request;
    }

    private static String label(WorkRequestStatus status) {
        return switch (status) {
            case REQUESTED -> "요청됨";
            case IN_PROGRESS -> "진행 중";
            case DONE -> "완료";
            case CANCELED -> "취소";
        };
    }

    private WorkRequest findRequest(UUID requestId) {
        return workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found"));
    }
}
