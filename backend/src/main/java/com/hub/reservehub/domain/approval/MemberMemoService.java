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

    public MemberMemoService(MemberMemoRepository memberMemoRepository, PlatformAccessGuard platformAccessGuard) {
        this.memberMemoRepository = memberMemoRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional
    public MemberMemo create(UUID platformId, AuthenticatedUser actor, UUID targetUserId, String content) {
        platformAccessGuard.verify(platformId, actor);
        return memberMemoRepository.save(new MemberMemo(platformId, targetUserId, actor.getId(), content));
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
