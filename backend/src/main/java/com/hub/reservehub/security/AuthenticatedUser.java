package com.hub.reservehub.security;

import com.hub.reservehub.domain.user.Role;
import com.hub.reservehub.domain.user.User;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Adapts the domain user entity to Spring Security's UserDetails contract.
 * 도메인 사용자 엔티티를 Spring Security의 UserDetails 형태로 맞춘다.
 */
public class AuthenticatedUser implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final Role role;

    private AuthenticatedUser(UUID id, String email, String passwordHash, Role role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getPasswordHash(), user.getRole());
    }

    // Exposes the application-specific identifier for downstream business logic.
    // 후속 비즈니스 로직에서 쓸 수 있도록 애플리케이션 고유 사용자 식별자를 노출한다.
    public UUID getId() {
        return id;
    }

    // Exposes the domain role so JWT claims and authorization can stay role-aware.
    // JWT 클레임과 인가 로직이 역할 정보를 사용할 수 있도록 도메인 역할을 노출한다.
    public Role getRole() {
        return role;
    }

    @Override
    // Maps the domain role to the Spring Security authority convention.
    // 도메인 역할을 Spring Security 권한 규칙에 맞는 형태로 변환한다.
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
