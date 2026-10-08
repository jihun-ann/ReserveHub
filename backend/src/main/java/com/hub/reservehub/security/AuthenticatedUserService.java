package com.hub.reservehub.security;

import java.util.Set;
import java.util.EnumSet;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.platform.PlatformStaffRepository;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads application users by username for Spring Security authentication.
 * Spring Security 인증을 위해 아이디(username) 기준으로 사용자를 불러온다.
 */
@Service
public class AuthenticatedUserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PlatformStaffRepository platformStaffRepository;

    public AuthenticatedUserService(UserRepository userRepository, PlatformStaffRepository platformStaffRepository) {
        this.userRepository = userRepository;
        this.platformStaffRepository = platformStaffRepository;
    }

    @Override
    // Uses the username field (not email) as the login identifier for authentication lookups.
    // 인증 조회에서 이메일이 아니라 username 필드를 로그인 식별자로 사용한다.
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        // 초대로 직원이 된 계정도 전역 role이 USER일 수 있어서, 실제 직원 배정에서 역할을 읽어 권한에 더한다.
        Set<Role> staffRoles = EnumSet.noneOf(Role.class);
        platformStaffRepository.findByUserIdAndIsActiveTrue(user.getId())
                .forEach(staff -> staffRoles.add(Role.valueOf(staff.getStaffRole().name())));
        return AuthenticatedUser.from(user, staffRoles);
    }
}
