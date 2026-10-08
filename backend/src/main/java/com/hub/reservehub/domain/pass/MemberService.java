package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.platform.StaffRole;
import com.hub.reservehub.domain.platform.ManagerPermission;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
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
 * A "member" is any user holding a UserPass at a platform; this joins that pass ownership
 * with the pass catalog entry and the user's account for the manager-facing member list.
 * "회원"은 플랫폼에서 수강권(UserPass)을 보유한 사용자다. 매니저용 회원 목록을 위해
 * 수강권 보유 정보를 수강권 카탈로그·사용자 정보와 조합한다.
 */
@Service
public class MemberService {

    private final UserPassRepository userPassRepository;
    private final PassRepository passRepository;
    private final UserRepository userRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public MemberService(
            UserPassRepository userPassRepository, PassRepository passRepository,
            UserRepository userRepository, PlatformAccessGuard platformAccessGuard
    ) {
        this.userPassRepository = userPassRepository;
        this.passRepository = passRepository;
        this.userRepository = userRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional(readOnly = true)
    public List<MemberPass> list(UUID platformId, AuthenticatedUser actor) {
        // 회원 관리/결제/수업 화면을 쓰는 매니저(와 오너)는 연락처·보호자 정보까지 본다. 강사는 출석 확인에 필요한
        // 이름과 수강권 상태만 보고, 연락처/보호자 정보는 가려서 받는다. 그 외는 접근할 수 없다.
        boolean contactVisible = platformAccessGuard.hasManagerPermission(
                platformId, actor, ManagerPermission.MENU_MEMBERS, ManagerPermission.MENU_PAYMENT, ManagerPermission.MENU_LESSON);
        if (!contactVisible) {
            platformAccessGuard.verifyRole(platformId, actor, StaffRole.TUTOR);
        }
        List<UserPass> userPasses = userPassRepository.findByPlatformId(platformId);

        Map<UUID, Pass> passesById = passRepository.findAllById(userPasses.stream().map(UserPass::getPassId).distinct().toList())
                .stream().collect(Collectors.toMap(Pass::getId, Function.identity()));
        Map<UUID, User> usersById = userRepository.findAllById(userPasses.stream().map(UserPass::getUserId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));

        return userPasses.stream()
                .map(up -> new MemberPass(up, passesById.get(up.getPassId()), usersById.get(up.getUserId()), contactVisible))
                .toList();
    }

    @Transactional
    // 매니저가 학생(회원)의 보호자 정보를 입력/수정한다 — 계정 소유자의 마이페이지 프로필과 별개로,
    // 회원이 이 플랫폼의 수강생일 때만 매니저가 대신 관리하는 정보다.
    public User updateGuardian(UUID platformId, AuthenticatedUser actor, UUID targetUserId, String guardianName, String guardianPhone) {
        platformAccessGuard.verifyManagerPermission(platformId, actor, ManagerPermission.MENU_MEMBERS);
        boolean isMember = userPassRepository.findByPlatformId(platformId).stream()
                .anyMatch(up -> up.getUserId().equals(targetUserId));
        if (!isMember) {
            throw new IllegalArgumentException("Member not found on this platform");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.updateGuardian(guardianName, guardianPhone);
        return user;
    }

    public record MemberPass(UserPass userPass, Pass pass, User user, boolean contactVisible) {
    }
}
