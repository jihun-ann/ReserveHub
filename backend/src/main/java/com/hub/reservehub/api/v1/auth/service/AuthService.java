package com.hub.reservehub.api.v1.auth.service;

import com.hub.reservehub.api.v1.auth.dto.AuthResult;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.JwtTokenProvider;
import java.util.UUID;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates user registration, credential verification, and token issuance.
 * 사용자 등록, 자격 증명 검증, 토큰 발급 흐름을 조율한다.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    // Persists a new user with a hashed password and issues a token without requiring a second login call.
    // 비밀번호 해시와 함께 사용자를 저장하고, 다시 로그인하지 않아도 되도록 토큰을 즉시 발급한다.
    public AuthResult register(String email, String rawPassword, Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("Email already exists");
        }

        User user = userRepository.save(new User(email, passwordEncoder.encode(rawPassword), role));
        AuthenticatedUser principal = AuthenticatedUser.from(user);
        return new AuthResult(jwtTokenProvider.createAccessToken(principal), user);
    }

    @Transactional(readOnly = true)
    // Delegates credential verification to Spring Security and mints a token for the authenticated principal.
    // 자격 증명 검증은 Spring Security에 맡기고, 인증된 사용자 기준으로 토큰을 발급한다.
    public AuthResult login(String email, String rawPassword) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, rawPassword)
            );
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new AuthResult(jwtTokenProvider.createAccessToken(principal), user);
    }

    @Transactional(readOnly = true)
    // Loads the current user entity for authenticated profile endpoints.
    // 인증된 사용자 프로필 엔드포인트에서 사용할 사용자 엔티티를 조회한다.
    public User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
