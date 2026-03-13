package com.hub.reservehub.api.v1.auth.controller;

import com.hub.reservehub.api.v1.auth.dto.AuthResult;
import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Handles authentication endpoints such as register, login, and current-user lookup.
 * 회원가입, 로그인, 현재 사용자 조회 같은 인증 엔드포인트를 처리한다.
 */
@RestController
@Validated
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public AuthController(AuthService authService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.authService = authService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/register")
    // Creates a new user account and returns a token for immediate authenticated use.
    // 새 사용자 계정을 만들고 바로 인증에 사용할 토큰을 반환한다.
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult authResult = authService.register(request.email(), request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(authResult));
    }

    @PostMapping("/login")
    // Verifies credentials and returns a fresh access token on success.
    // 자격 증명을 검증하고 성공하면 새로운 액세스 토큰을 반환한다.
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AuthResult authResult = authService.login(request.email(), request.password());
        return AuthResponse.from(authResult);
    }

    @GetMapping("/me")
    // Resolves the current authenticated principal into the latest persisted user profile.
    // 현재 인증된 사용자를 기준으로 최신 사용자 프로필을 조회한다.
    public UserProfileResponse me() {
        AuthenticatedUser authenticatedUser = currentAuthenticatedUser.get();
        User user = authService.getUser(authenticatedUser.getId());
        return UserProfileResponse.from(user);
    }

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(String accessToken, UserProfileResponse user) {

        public static AuthResponse from(AuthResult authResult) {
            return new AuthResponse(authResult.accessToken(), UserProfileResponse.from(authResult.user()));
        }
    }

    public record UserProfileResponse(String id, String email, Role role) {

        public static UserProfileResponse from(User user) {
            return new UserProfileResponse(user.getId().toString(), user.getEmail(), user.getRole());
        }
    }
}
