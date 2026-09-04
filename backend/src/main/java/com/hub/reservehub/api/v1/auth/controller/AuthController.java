package com.hub.reservehub.api.v1.auth.controller;

import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Handles authentication endpoints such as register, login, and current-user lookup. Login and
 * register never return a token — they authenticate the request, persist the resulting
 * SecurityContext into the HTTP session, and let Spring Security's session cookie (set on the
 * response automatically) carry the session id from here on.
 * 회원가입, 로그인, 현재 사용자 조회 같은 인증 엔드포인트를 처리한다. 로그인/회원가입은 토큰을
 * 반환하지 않는다 — 인증한 뒤 그 결과인 SecurityContext를 HTTP 세션에 저장하고, 이후로는 Spring
 * Security가 응답에 자동으로 실어 보내는 세션 쿠키가 세션 id를 전달한다.
 */
@RestController
@Validated
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(AuthService authService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.authService = authService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/register")
    // Creates a new user account and signs them in immediately via the session (no token issued).
    // 새 사용자 계정을 만들고 세션으로 바로 로그인 상태로 만든다 (토큰 미발급).
    public ResponseEntity<UserProfileResponse> register(
            @Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse
    ) {
        User user = authService.register(
                request.username(), request.email(), request.password(), request.role(), request.name(), request.phone()
        );
        persistSession(httpRequest, httpResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserProfileResponse.from(user));
    }

    @PostMapping("/login")
    // Verifies credentials and, on success, starts a server session — the browser only ever sees
    // the resulting HttpOnly session cookie, never the credentials or a bearer token.
    // 자격 증명을 검증하고 성공하면 서버 세션을 시작한다 — 브라우저는 자격 증명이나 bearer 토큰이
    // 아니라 그 결과인 HttpOnly 세션 쿠키만 보게 된다.
    public UserProfileResponse login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse
    ) {
        User user = authService.login(request.username(), request.password());
        persistSession(httpRequest, httpResponse);
        return UserProfileResponse.from(user);
    }

    @GetMapping("/me")
    // Resolves the current authenticated principal into the latest persisted user profile.
    // 현재 인증된 사용자를 기준으로 최신 사용자 프로필을 조회한다.
    public UserProfileResponse me() {
        AuthenticatedUser authenticatedUser = currentAuthenticatedUser.get();
        User user = authService.getUser(authenticatedUser.getId());
        return UserProfileResponse.from(user);
    }

    // Spring Security 6's session filter only loads the context; a fresh login/register must
    // explicitly save it back, or the session cookie the browser receives won't carry it.
    // Spring Security 6의 세션 필터는 컨텍스트를 불러오기만 하므로, 방금 로그인/가입한 경우엔
    // 직접 저장해줘야 브라우저가 받는 세션 쿠키에 인증 정보가 실린다.
    private void persistSession(HttpServletRequest request, HttpServletResponse response) {
        SecurityContext context = SecurityContextHolder.getContext();
        securityContextRepository.saveContext(context, request, response);
    }

    public record RegisterRequest(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "아이디는 영문/숫자/밑줄 4~20자여야 합니다") String username,
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role,
            @NotBlank String name,
            String phone
    ) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record UserProfileResponse(
            String id, String username, String email, Role role, String name, String phone,
            String bankName, String bankAccountNumber, String bankAccountHolder
    ) {

        public static UserProfileResponse from(User user) {
            return new UserProfileResponse(
                    user.getId().toString(), user.getUsername(), user.getEmail(), user.getRole(), user.getName(), user.getPhone(),
                    user.getBankName(), user.getBankAccountNumber(), user.getBankAccountHolder()
            );
        }
    }
}
