package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogService;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class ActionLogController {

    private final ActionLogService actionLogService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public ActionLogController(ActionLogService actionLogService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.actionLogService = actionLogService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @GetMapping("/api/v1/platforms/{platformId}/action-logs")
    public List<ActionLogResponse> list(@PathVariable UUID platformId) {
        return actionLogService.list(platformId, currentAuthenticatedUser.get()).stream()
                .map(ActionLogResponse::from)
                .toList();
    }

    public record ActionLogResponse(
            UUID id, UUID actorId, String actorName, ActionTarget targetType, UUID targetId,
            String action, String memo, Instant createdAt
    ) {
        public static ActionLogResponse from(ActionLogService.Entry entry) {
            ActionLog log = entry.log();
            return new ActionLogResponse(
                    log.getId(), log.getActorId(), entry.actor() != null ? entry.actor().getName() : null,
                    log.getTargetType(), log.getTargetId(), log.getAction(), log.getMemo(), log.getCreatedAt()
            );
        }
    }
}
