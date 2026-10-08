package com.hub.reservehub.domain.user;

import java.time.LocalDate;
import java.time.Instant;
import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    // 로그인 아이디 — 이메일과 별개의 통상적인 아이디 형식(영문/숫자/밑줄). 로그인 식별자는 이걸
    // 쓰고, 이메일은 연락처 성격의 정보로 분리해서 관리한다.
    @Column(nullable = false, unique = true)
    private String username;

    // 이메일은 활성 계정끼리만 유일하다(DB 부분 유니크 인덱스) — 비활성화한 계정의 이메일은 다시 가입에 쓸 수 있다.
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String name;

    @Nullable
    private String phone;

    // 정산/급여 계좌 — 세무사가 플랫폼별 강사·매니저 정산 정보를 조회할 때 쓴다. 본인이 마이페이지에서
    // 직접 등록한다 (계좌는 플랫폼이 아니라 사람에 딸린 정보라 User에 둔다).
    @Nullable
    private String bankName;

    @Nullable
    private String bankAccountNumber;

    @Nullable
    private String bankAccountHolder;

    // 보호자 정보 — 학생(수강생) 계정에 한해 매니저가 입력/수정한다.
    @Nullable
    private String guardianName;

    @Nullable
    private String guardianPhone;

    // 생년월일 — 미성년 여부 판단/보호자 안내 기준. 본인이 내 정보에서 입력한다.
    @Nullable
    private LocalDate birthDate;

    // 이메일/연락처 인증 시각 — 인증 코드를 확인했을 때만 채워지고, 해당 값이 바뀌면 다시 null로 돌아간다.
    @Nullable
    private Instant emailVerifiedAt;

    @Nullable
    private Instant phoneVerifiedAt;

    // 계정 탈퇴는 삭제가 아니라 비활성화다 — 이력/주문/수강권이 이 계정을 참조하므로 행은 남기고 로그인만 막는다.
    @Column(nullable = false)
    private boolean isActive = true;

    protected User() {
        // JPA only.
    }

    public User(String username, String email, String passwordHash, Role role, String name, @Nullable String phone) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.name = name;
        this.phone = phone;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public String getName() {
        return name;
    }

    @Nullable
    public String getPhone() {
        return phone;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void updateProfile(String name, @Nullable String phone, String email) {
        // 값이 바뀌면 이전 인증은 효력이 없다.
        if (!email.equalsIgnoreCase(this.email)) {
            this.emailVerifiedAt = null;
        }
        if (!digitsOf(phone).equals(digitsOf(this.phone))) {
            this.phoneVerifiedAt = null;
        }
        this.name = name;
        this.phone = phone;
        this.email = email;
    }

    @Nullable
    public String getBankName() {
        return bankName;
    }

    @Nullable
    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    @Nullable
    public String getBankAccountHolder() {
        return bankAccountHolder;
    }

    public void updateBankInfo(@Nullable String bankName, @Nullable String bankAccountNumber, @Nullable String bankAccountHolder) {
        this.bankName = bankName;
        this.bankAccountNumber = bankAccountNumber;
        this.bankAccountHolder = bankAccountHolder;
    }

    @Nullable
    public String getGuardianName() {
        return guardianName;
    }

    @Nullable
    public String getGuardianPhone() {
        return guardianPhone;
    }

    public void updateGuardian(@Nullable String guardianName, @Nullable String guardianPhone) {
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
    }

    private static String digitsOf(@Nullable String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    @Nullable
    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void changeBirthDate(@Nullable LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    @Nullable
    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    @Nullable
    public Instant getPhoneVerifiedAt() {
        return phoneVerifiedAt;
    }

    public void markEmailVerified() {
        this.emailVerifiedAt = Instant.now();
    }

    public void markPhoneVerified() {
        this.phoneVerifiedAt = Instant.now();
    }

    public boolean isActive() {
        return isActive;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
