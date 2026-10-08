package com.hub.reservehub.api.v1.auth.controller;

import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import com.hub.reservehub.security.JwtTokenProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Handles authentication endpoints such as register, login, and current-user lookup. Login and
 * register mint a signed JWT access token — the client decodes it directly for id/username/role,
 * and sends it back as an Authorization: Bearer header on every subsequent request to identify
 * itself (JwtAuthenticationFilter restores the SecurityContext from it, no server-side session).
 * 회원가입, 로그인, 현재 사용자 조회 같은 인증 엔드포인트를 처리한다. 로그인/회원가입은 서명된 JWT
 * 액세스 토큰을 발급한다 — 클라이언트가 토큰을 직접 복호화해 id/username/role을 얻고, 이후 모든
 * 요청에 Authorization: Bearer 헤더로 실어 보내 자신을 증명한다(JwtAuthenticationFilter가 이 토큰으로
 * SecurityContext를 복원하며, 서버 측 세션은 없다).
 */
@RestController
@Validated
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService, CurrentAuthenticatedUser currentAuthenticatedUser, JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    // Creates a new user account and immediately mints an access token for it (no separate login call needed).
    // 새 사용자 계정을 만들고 바로 액세스 토큰을 발급한다 (별도 로그인 호출 불필요).
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(
                request.username(), request.email(), request.password(), request.role(), request.name(), request.phone()
        );
        String accessToken = jwtTokenProvider.createAccessToken(AuthenticatedUser.from(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(new TokenResponse(accessToken));
    }

    @PostMapping("/login")
    // Verifies credentials and, on success, mints a signed access token — the browser never sees
    // the credentials again, only this token, which it must resend as a Bearer header.
    // 자격 증명을 검증하고 성공하면 서명된 액세스 토큰을 발급한다 — 이후 브라우저는 자격 증명 대신
    // 이 토큰만 보게 되며, Bearer 헤더로 다시 실어 보내야 한다.
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        User user = authService.login(request.username(), request.password());
        String accessToken = jwtTokenProvider.createAccessToken(AuthenticatedUser.from(user));
        return new TokenResponse(accessToken);
    }

    @GetMapping("/me")
    // Resolves the current authenticated principal (from the Bearer token) into the latest persisted user profile.
    // 현재 인증된 사용자(Bearer 토큰 기준)를 최신 사용자 프로필로 조회한다.
    public UserProfileResponse me() {
        AuthenticatedUser authenticatedUser = currentAuthenticatedUser.get();
        User user = authService.getUser(authenticatedUser.getId());
        return UserProfileResponse.from(user);
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

    public record TokenResponse(String accessToken) {
    }

    public record UserProfileResponse(
            String id, String username, String email, Role role, String name, String phone,
            String bankName, String bankAccountNumber, String bankAccountHolder,
            java.time.LocalDate birthDate, String guardianName, String guardianPhone, boolean emailVerified, boolean phoneVerified
    ) {

        public static UserProfileResponse from(User user) {
            return new UserProfileResponse(
                    user.getId().toString(), user.getUsername(), user.getEmail(), user.getRole(), user.getName(), user.getPhone(),
                    user.getBankName(), user.getBankAccountNumber(), user.getBankAccountHolder(),
                    user.getBirthDate(), user.getGuardianName(), user.getGuardianPhone(),
                    user.getEmailVerifiedAt() != null, user.getPhoneVerifiedAt() != null
            );
        }
    }
}
