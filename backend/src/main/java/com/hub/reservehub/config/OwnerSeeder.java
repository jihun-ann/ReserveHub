package com.hub.reservehub.config;

import com.hub.reservehub.api.v1.auth.service.AuthService;
import com.hub.reservehub.domain.platform.BusinessType;
import com.hub.reservehub.domain.platform.PlatformService;
import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import org.springframework.boot.CommandLineRunner;

/**
 * 실제(영구) DB 환경에서 동작 확인용 최소 계정만 심는다 — 테스트 오너 1명 + 플랫폼 1개.
 * DummyDataSeeder(H2 전용, 전체 더미데이터)와 달리 이미 심어져 있으면 건너뛴다 — 영구 DB는
 * 재시작해도 데이터가 남아있어서, 가드가 없으면 기동할 때마다 중복 키 충돌로 깨진다.
 *
 * 비활성화됨 — owner/test 계정이 이미 심어져 있어 더 필요 없다. @Component를 빼서 Spring이
 * 아예 빈으로 등록하지 않는다. 새 DB에 다시 시드해야 하면 @Component와 @Profile("postgres")를
 * 되살리면 된다.
 */
public class OwnerSeeder implements CommandLineRunner {

    private static final String OWNER_USERNAME = "owner";
    private static final String PASSWORD = "test";

    private final UserRepository userRepository;
    private final AuthService authService;
    private final PlatformService platformService;

    public OwnerSeeder(UserRepository userRepository, AuthService authService, PlatformService platformService) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.platformService = platformService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(OWNER_USERNAME).isPresent()) {
            System.out.println("[OwnerSeeder] already seeded, skip");
            return;
        }

        User owner = authService.register(OWNER_USERNAME, "owner@test.com", PASSWORD, Role.OWNER, "테스트 오너", "010-0000-0000");
        platformService.create(
                AuthenticatedUser.from(owner), "ReserveHub 테스트 스튜디오", BusinessType.FITNESS,
                "02-1234-5678", "서울시 강남구", "최소 시드용 테스트 플랫폼"
        );
        System.out.println("[OwnerSeeder] seeded owner/test + platform");
    }
}
