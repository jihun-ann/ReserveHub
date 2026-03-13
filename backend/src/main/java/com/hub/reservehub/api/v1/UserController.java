package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
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

    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
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
                request.email(),
                passwordEncoder.encode(request.password()),
                request.role()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    public record CreateUserRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role
    ) {
    }

    public record UserResponse(UUID id, String email, Role role) {

        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getRole());
        }
    }
}
