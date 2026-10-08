package com.hub.reservehub.domain.user;

import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassRepository;
import com.hub.reservehub.domain.platform.JoinRequest;
import com.hub.reservehub.domain.platform.JoinRequestRepository;
import com.hub.reservehub.domain.platform.Platform;
import com.hub.reservehub.domain.platform.PlatformRepository;
import com.hub.reservehub.domain.platform.PlatformStaff;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 다른 사용자의 프로필을 볼 수 있는 범위를 정한다 — 본인은 항상 볼 수 있고, 남의 정보는 내가 오너/직원으로 있는
 * 플랫폼과 연결된 사람(직원, 수강권 보유 회원, 가입 신청자, 그 플랫폼 오너)만 볼 수 있다. 아무 로그인 사용자나
 * UUID만 알면 남의 이메일/연락처를 읽던 것을 막는다.
 */
@Service
public class UserDirectoryService {

    private final UserService userService;
    private final PlatformRepository platformRepository;
    private final PlatformStaffRepository staffRepository;
    private final UserPassRepository userPassRepository;
    private final JoinRequestRepository joinRequestRepository;

    public UserDirectoryService(
            UserService userService, PlatformRepository platformRepository, PlatformStaffRepository staffRepository,
            UserPassRepository userPassRepository, JoinRequestRepository joinRequestRepository
    ) {
        this.userService = userService;
        this.platformRepository = platformRepository;
        this.staffRepository = staffRepository;
        this.userPassRepository = userPassRepository;
        this.joinRequestRepository = joinRequestRepository;
    }

    @Transactional(readOnly = true)
    public User getVisible(UUID targetId, UUID actorId) {
        User target = userService.get(targetId);
        if (targetId.equals(actorId)) {
            return target;
        }
        // 내가 오너이거나 활성 직원인 플랫폼들
        Set<UUID> mine = new HashSet<>();
        platformRepository.findByCreatedBy(actorId).forEach(p -> mine.add(p.getId()));
        staffRepository.findByUserIdAndIsActiveTrue(actorId).forEach(s -> mine.add(s.getPlatformId()));
        if (mine.isEmpty()) {
            throw new AccessDeniedException("다른 사용자의 정보를 볼 수 없습니다.");
        }
        // 대상이 그 플랫폼들과 맺고 있는 관계
        Set<UUID> theirs = new HashSet<>();
        platformRepository.findByCreatedBy(targetId).stream().map(Platform::getId).forEach(theirs::add);
        staffRepository.findByUserId(targetId).stream().map(PlatformStaff::getPlatformId).forEach(theirs::add);
        userPassRepository.findByUserId(targetId).stream().map(UserPass::getPlatformId).forEach(theirs::add);
        joinRequestRepository.findByUserIdOrderByCreatedAtDesc(targetId).stream().map(JoinRequest::getPlatformId).forEach(theirs::add);
        if (Collections.disjoint(mine, theirs)) {
            throw new AccessDeniedException("다른 사용자의 정보를 볼 수 없습니다.");
        }
        return target;
    }
}
