package com.hub.reservehub.domain.user;

import com.hub.reservehub.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
public class User extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    // 로그인 아이디 — 이메일과 별개의 통상적인 아이디 형식(영문/숫자/밑줄). 로그인 식별자는 이걸
    // 쓰고, 이메일은 연락처 성격의 정보로 분리해서 관리한다.
    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
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
        this.name = name;
        this.phone = phone;
        this.email = email;
    }
}
