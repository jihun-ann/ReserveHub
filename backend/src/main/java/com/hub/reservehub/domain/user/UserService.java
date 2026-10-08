package com.hub.reservehub.domain.user;

import org.springframework.lang.Nullable;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    // Saves a new user after the caller has already prepared the password hash.
    // 호출 측에서 준비한 비밀번호 해시를 받아 새 사용자를 저장한다.
    public User create(String username, String email, String passwordHash, Role role, String name, String phone) {
        return userRepository.save(new User(username, email, passwordHash, role, name, phone));
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
        return userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    // 이미 있는 이메일이면 역할이 맞는지 확인하고 그대로 반환하고, 없으면 새로 만든다 — 세무사처럼
    // 여러 플랫폼에 걸쳐 재사용되는 계정을 오너가 초대할 때마다 새로 만들지 않고 이어붙일 수 있게 한다.
    public User findOrCreateWithRole(String username, String email, String rawPassword, Role role, String name, String phone) {
        return userRepository.findByEmailAndIsActiveTrue(email)
                .map(existing -> {
                    if (existing.getRole() != role) {
                        throw new IllegalStateException("이미 다른 역할로 등록된 이메일입니다.");
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(new User(username, email, passwordEncoder.encode(rawPassword), role, name, phone)));
    }

    @Transactional
    public void changePassword(UUID id, String currentRawPassword, String newRawPassword) {
        User user = get(id);
        if (!passwordEncoder.matches(currentRawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.changePassword(passwordEncoder.encode(newRawPassword));
    }

    @Transactional
    // 이메일도 이 화면에서 바꿀 수 있게 하되, 다른 계정이 이미 쓰는 이메일로는 바꿀 수 없게 막는다.
    public User updateProfile(UUID id, String name, String phone, String email) {
        User user = get(id);
        userRepository.findByEmailAndIsActiveTrue(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalStateException("Email already exists");
                });
        user.updateProfile(name, phone, email);
        return user;
    }

    // 생년월일과 보호자 정보 — 본인이 내 정보에서 직접 입력/수정한다(매니저가 입력하던 보호자 정보와 같은 필드).
    @Transactional
    public User updateDetails(UUID id, @Nullable LocalDate birthDate, @Nullable String guardianName, @Nullable String guardianPhone) {
        if (birthDate != null && birthDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("생년월일은 오늘 이후일 수 없습니다.");
        }
        User user = get(id);
        user.changeBirthDate(birthDate);
        user.updateGuardian(blankToNull(guardianName), blankToNull(guardianPhone));
        return user;
    }

    private static String blankToNull(@Nullable String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public User updateBankInfo(UUID id, String bankName, String bankAccountNumber, String bankAccountHolder) {
        User user = get(id);
        user.updateBankInfo(bankName, bankAccountNumber, bankAccountHolder);
        return user;
    }
}
