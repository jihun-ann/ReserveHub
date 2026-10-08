package com.hub.reservehub.domain.user;

import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    // 이메일은 활성 계정끼리만 유일하다 — 비활성화(탈퇴)한 계정의 이메일은 조회/중복 검사에서 제외한다.
    // (같은 이메일의 행이 여러 개일 수 있어 활성 조건 없는 조회는 두지 않는다.)
    Optional<User> findByEmailAndIsActiveTrue(String email);

    // 아이디(username)는 비활성 계정까지 포함해 전체에서 유일하다 — 탈퇴한 아이디는 다시 쓸 수 없다.
    Optional<User> findByUsername(String username);
}
