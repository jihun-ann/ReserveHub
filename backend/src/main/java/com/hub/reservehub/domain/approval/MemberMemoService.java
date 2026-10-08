package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberMemoService {

    private final MemberMemoRepository memberMemoRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;

    public MemberMemoService(
            MemberMemoRepository memberMemoRepository, PlatformAccessGuard platformAccessGuard,
            ActionLogRepository actionLogRepository
    ) {
        this.memberMemoRepository = memberMemoRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
    }

    @Transactional
    public MemberMemo create(UUID platformId, AuthenticatedUser actor, UUID targetUserId, String content) {
        platformAccessGuard.verify(platformId, actor);
        MemberMemo memo = memberMemoRepository.save(new MemberMemo(platformId, targetUserId, actor.getId(), content));
        actionLogRepository.save(ActionLog.of(platformId, actor.getId(), ActionTarget.MEMBER_MEMO, memo.getId(), "CREATE",
                "회원 메모 작성: \"" + LogMemo.clip(content, 100) + "\""));
        return memo;
    }

    @Transactional(readOnly = true)
    public List<MemberMemo> list(UUID platformId, AuthenticatedUser actor, UUID targetUserId) {
        platformAccessGuard.verify(platformId, actor);
        return memberMemoRepository.findByPlatformIdAndUserId(platformId, targetUserId);
    }

    @Transactional
    public void delete(UUID platformId, AuthenticatedUser actor, UUID memoId) {
        platformAccessGuard.verify(platformId, actor);
        MemberMemo memo = memberMemoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalArgumentException("Memo not found"));
        if (!memo.getPlatformId().equals(platformId)) {
            throw new IllegalArgumentException("Memo not found");
        }
        memberMemoRepository.delete(memo);
    }
}
