package com.hub.reservehub.api.v1.auth.service;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.util.UUID;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates user registration and credential verification. No token is minted anywhere —
 * the caller (AuthController) persists the SecurityContext this sets into the HTTP session,
 * and the browser only ever sees an HttpOnly session cookie.
 * 사용자 등록과 자격 증명 검증을 조율한다. 어디서도 토큰을 발급하지 않는다 — 호출자(AuthController)가
 * 여기서 설정한 SecurityContext를 HTTP 세션에 저장하고, 브라우저는 HttpOnly 세션 쿠키만 보게 된다.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    // Persists a new user with a hashed password and signs them in immediately (no second login call needed).
    // username은 로그인에 쓰는 통상적인 아이디, email은 별개의 연락처 정보로 각각 중복 검사한다.
    // 비밀번호 해시와 함께 사용자를 저장하고, 다시 로그인하지 않아도 되도록 바로 로그인 상태로 만든다.
    public User register(String username, String email, String rawPassword, Role role, String name, String phone) {
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalStateException("Username already exists");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("Email already exists");
        }

        User user = userRepository.save(new User(username, email, passwordEncoder.encode(rawPassword), role, name, phone));
        AuthenticatedUser principal = AuthenticatedUser.from(user);
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return user;
    }

    @Transactional(readOnly = true)
    // Delegates credential verification to Spring Security and leaves the resulting Authentication
    // on the SecurityContextHolder for the controller to persist into the session.
    // 자격 증명 검증은 Spring Security에 맡기고, 컨트롤러가 세션에 저장할 수 있도록 인증 결과를
    // SecurityContextHolder에 남겨둔다.
    public User login(String username, String rawPassword) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, rawPassword)
            );
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional(readOnly = true)
    // Loads the current user entity for authenticated profile endpoints.
    // 인증된 사용자 프로필 엔드포인트에서 사용할 사용자 엔티티를 조회한다.
    public User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
