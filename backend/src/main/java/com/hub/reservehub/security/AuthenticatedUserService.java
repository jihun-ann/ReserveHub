package com.hub.reservehub.security;

import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads application users by email for Spring Security authentication.
 * Spring Security 인증을 위해 이메일 기준으로 사용자를 불러온다.
 */
@Service
public class AuthenticatedUserService implements UserDetailsService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    // Uses email as the login identifier for authentication lookups.
    // 인증 조회에서 이메일을 로그인 식별자로 사용한다.
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return AuthenticatedUser.from(user);
    }
}
