package com.hub.reservehub.security;

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

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    // Uses the username field (not email) as the login identifier for authentication lookups.
    // 인증 조회에서 이메일이 아니라 username 필드를 로그인 식별자로 사용한다.
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return AuthenticatedUser.from(user);
    }
}
