package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.user.UserDirectoryService;
import java.time.LocalDate;
import com.hub.reservehub.api.v1.auth.controller.AuthController.UserProfileResponse;
import com.hub.reservehub.domain.user.VerificationChannel;
import com.hub.reservehub.domain.user.ContactVerificationService;
import com.hub.reservehub.domain.user.AccountService;
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
    private final AccountService accountService;
    private final ContactVerificationService verificationService;
    private final UserDirectoryService userDirectoryService;

    public UserController(
            UserService userService, PasswordEncoder passwordEncoder, CurrentAuthenticatedUser currentAuthenticatedUser,
            AccountService accountService, ContactVerificationService verificationService, UserDirectoryService userDirectoryService
    ) {
        this.userDirectoryService = userDirectoryService;
        this.accountService = accountService;
        this.verificationService = verificationService;
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

    // 생년월일 + 보호자 정보 — 본인이 직접 입력한다.
    @PatchMapping("/me/details")
    public UserProfileResponse updateDetails(@Valid @RequestBody UpdateDetailsRequest request) {
        return UserProfileResponse.from(userService.updateDetails(
                currentAuthenticatedUser.get().getId(), request.birthDate(), request.guardianName(), request.guardianPhone()));
    }

    public record UpdateDetailsRequest(LocalDate birthDate, String guardianName, String guardianPhone) {
    }

    // 이메일/연락처 인증 — 코드를 요청하고(서버 로그/발송기로 전달), 받은 코드를 확인한다.
    @PostMapping("/me/verifications/{channel}/request")
    public ResponseEntity<Void> requestVerification(@PathVariable VerificationChannel channel) {
        verificationService.request(currentAuthenticatedUser.get().getId(), channel);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/verifications/{channel}/confirm")
    public UserProfileResponse confirmVerification(@PathVariable VerificationChannel channel, @Valid @RequestBody VerifyCodeRequest request) {
        return UserProfileResponse.from(verificationService.confirm(currentAuthenticatedUser.get().getId(), channel, request.code()));
    }

    public record VerifyCodeRequest(@NotBlank String code) {
    }

    // 계정 탈퇴 = 비활성화. 삭제하지 않고 로그인만 막는다(비밀번호 확인 필요).
    @PostMapping("/me/deactivate")
    public ResponseEntity<Void> deactivate(@Valid @RequestBody DeactivateRequest request) {
        accountService.deactivate(currentAuthenticatedUser.get().getId(), request.password());
        return ResponseEntity.noContent().build();
    }

    public record DeactivateRequest(@NotBlank String password) {
    }

    @GetMapping("/{id}")
    // Returns a single user by id for protected internal lookups.
    // 보호된 내부 조회 용도로 id 기준 사용자 한 명을 반환한다.
    // 본인은 전체 정보, 다른 사람은 내가 오너/직원인 플랫폼과 연결된 경우에만 — 그것도 정산 계좌/보호자 정보는 뺀 공개용만.
    public UserResponse getUser(@PathVariable UUID id) {
        UUID actorId = currentAuthenticatedUser.get().getId();
        User user = userDirectoryService.getVisible(id, actorId);
        return user.getId().equals(actorId) ? UserResponse.from(user) : UserResponse.publicView(user);
    }

    @PostMapping
    // Creates a user with a hashed password when management APIs provision accounts directly.
    // 관리 API가 계정을 직접 생성할 때 비밀번호를 해시해서 사용자를 만든다.
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        accountService.verifyCanProvisionAccount(currentAuthenticatedUser.get().getId(), request.role());
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

        // 다른 사람에게 보여줄 때 — 정산 계좌와 보호자 정보는 제외한다.
        public static UserResponse publicView(User user) {
            return new UserResponse(
                    user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getName(), user.getPhone(),
                    null, null, null, null, null
            );
        }

        public static UserResponse from(User user) {
            return new UserResponse(
                    user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getName(), user.getPhone(),
                    user.getBankName(), user.getBankAccountNumber(), user.getBankAccountHolder(),
                    user.getGuardianName(), user.getGuardianPhone()
            );
        }
    }
}
