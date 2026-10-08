package com.hub.reservehub.security;

import java.util.Set;
import java.util.EnumSet;
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
    private final String username;
    private final String passwordHash;
    private final Role role;
    private final boolean enabled;
    // 이 계정이 플랫폼에서 실제로 맡은 직원 역할(MANAGER/TUTOR) — 초대로 합류한 사람은 전역 role이 USER여도
    // 이 역할로 컨트롤러의 hasAnyRole 검사를 통과한다. 어느 플랫폼에서 무엇을 할 수 있는지는 서비스의 PlatformAccessGuard가 따로 정한다.
    private final Set<Role> platformRoles;

    private AuthenticatedUser(UUID id, String username, String passwordHash, Role role, boolean enabled, Set<Role> platformRoles) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
        this.platformRoles = platformRoles;
    }

    public static AuthenticatedUser from(User user) {
        return from(user, EnumSet.noneOf(Role.class));
    }

    public static AuthenticatedUser from(User user, Set<Role> platformRoles) {
        return new AuthenticatedUser(user.getId(), user.getUsername(), user.getPasswordHash(), user.getRole(), user.isActive(), platformRoles);
    }

    // Exposes the application-specific identifier for downstream business logic.
    // 후속 비즈니스 로직에서 쓸 수 있도록 애플리케이션 고유 사용자 식별자를 노출한다.
    public UUID getId() {
        return id;
    }

    // Exposes the domain role so downstream authorization checks can stay role-aware.
    // 인가 로직이 역할 정보를 사용할 수 있도록 도메인 역할을 노출한다.
    public Role getRole() {
        return role;
    }

    @Override
    // Maps the domain role to the Spring Security authority convention.
    // 도메인 역할을 Spring Security 권한 규칙에 맞는 형태로 변환한다.
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<Role> all = EnumSet.of(role);
        all.addAll(platformRoles);
        return all.stream().map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r.name())).toList();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    // 비활성화(탈퇴)한 계정은 로그인할 수 없고, 이미 발급된 토큰으로도 요청할 수 없다.
    public boolean isEnabled() {
        return enabled;
    }
}
