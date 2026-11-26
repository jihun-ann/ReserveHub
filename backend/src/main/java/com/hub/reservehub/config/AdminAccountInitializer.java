package com.hub.reservehub.config;

import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Creates the service ADMIN account on startup from ADMIN_USERNAME / ADMIN_PASSWORD, once.
 * 기동 시 ADMIN_USERNAME / ADMIN_PASSWORD 환경변수로 서비스 운영자 계정을 한 번 만든다.
 * 회원가입으로는 ADMIN을 만들 수 없으므로 이게 유일한 생성 경로다. 값이 없으면 아무것도 하지 않는다
 * (기본 비밀번호를 코드에 두지 않기 위해). 이미 있는 계정은 건드리지 않는다 — 비밀번호 변경은 내 정보 화면에서.
 */
@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final AuthService authService;
    private final UserRepository userRepository;
    private final String username;
    private final String password;
    private final String email;

    public AdminAccountInitializer(
            AuthService authService, UserRepository userRepository,
            @Value("${app.admin.username:}") String username,
            @Value("${app.admin.password:}") String password,
            @Value("${app.admin.email:admin@reservehub.local}") String email
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    @Override
    public void run(String... args) {
        if (username.isBlank() || password.isBlank()) {
            return;
        }
        var existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            // 같은 아이디의 일반 계정을 운영자로 올려버리면 그 사람에게 심사 권한이 넘어간다 — 경고만 남긴다.
            if (existing.get().getRole() != Role.ADMIN) {
                log.warn("ADMIN_USERNAME '{}' is already used by a non-admin account; admin account was not created.", username);
            }
            return;
        }
        if (password.length() < 12) {
            log.warn("ADMIN_PASSWORD is shorter than 12 characters; admin account was not created.");
            return;
        }
        authService.register(username, email, password, Role.ADMIN, "운영자", null);
        log.info("Created ADMIN account '{}'.", username);
    }
}
