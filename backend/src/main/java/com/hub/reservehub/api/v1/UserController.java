package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public UserController(UserService userService, PasswordEncoder passwordEncoder, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentAuthenticatedUser.get().getId(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(currentAuthenticatedUser.get().getId(), request.name(), request.phone(), request.email());
        return UserResponse.from(user);
    }

    public record UpdateProfileRequest(@NotBlank String name, String phone, @Email @NotBlank String email) {
    }

    @PatchMapping("/me/bank-info")
    // 정산 계좌 — 본인이 마이페이지에서 등록하면, 오너가 초대한 세무사가 플랫폼별로 조회할 수 있다.
    public UserResponse updateBankInfo(@Valid @RequestBody UpdateBankInfoRequest request) {
        User user = userService.updateBankInfo(
                currentAuthenticatedUser.get().getId(), request.bankName(), request.bankAccountNumber(), request.bankAccountHolder()
        );
        return UserResponse.from(user);
    }

    public record UpdateBankInfoRequest(String bankName, String bankAccountNumber, String bankAccountHolder) {
    }

    @GetMapping("/{id}")
    // Returns a single user by id for protected internal lookups.
    // 보호된 내부 조회 용도로 id 기준 사용자 한 명을 반환한다.
    public UserResponse getUser(@PathVariable UUID id) {
        User user = userService.get(id);
        return UserResponse.from(user);
    }

    @PostMapping
    // Creates a user with a hashed password when management APIs provision accounts directly.
    // 관리 API가 계정을 직접 생성할 때 비밀번호를 해시해서 사용자를 만든다.
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.create(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password()),
                request.role(),
                request.name(),
                request.phone()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    public record CreateUserRequest(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "아이디는 영문/숫자/밑줄 4~20자여야 합니다") String username,
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role,
            @NotBlank String name,
            String phone
    ) {
    }

    public record UserResponse(
            UUID id, String username, String email, Role role, String name, String phone,
            String bankName, String bankAccountNumber, String bankAccountHolder,
            String guardianName, String guardianPhone
    ) {

        public static UserResponse from(User user) {
            return new UserResponse(
                    user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getName(), user.getPhone(),
                    user.getBankName(), user.getBankAccountNumber(), user.getBankAccountHolder(),
                    user.getGuardianName(), user.getGuardianPhone()
            );
        }
    }
}
