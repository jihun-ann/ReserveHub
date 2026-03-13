package com.hub.reservehub.domain.user;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    // Saves a new user after the caller has already prepared the password hash.
    // 호출 측에서 준비한 비밀번호 해시를 받아 새 사용자를 저장한다.
    public User create(String email, String passwordHash, Role role) {
        return userRepository.save(new User(email, passwordHash, role));
    }

    @Transactional(readOnly = true)
    // Fetches a user by primary key for profile and admin flows.
    // 프로필 조회나 관리자 흐름에서 사용할 사용자를 기본 키로 조회한다.
    public User get(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional(readOnly = true)
    // Fetches a user by email for login-related lookups.
    // 로그인 관련 조회를 위해 이메일 기준으로 사용자를 찾는다.
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
