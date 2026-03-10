package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        User user = userService.get(id);
        return UserResponse.from(user);
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.create(request.email(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    public record CreateUserRequest(String email, Role role) {
    }

    public record UserResponse(UUID id, String email, Role role) {

        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getRole());
        }
    }
}
