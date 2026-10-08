package com.hub.reservehub.domain.platform;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * 플랫폼별 매니저 그룹 — "일반/관리자/임원"처럼 플랫폼이 이름을 정하고, 그 그룹이 쓸 수 있는 메뉴/기능
 * (ManagerPermission)을 골라 준다. 매니저는 그룹 하나에 속하고 그 그룹의 권한을 갖는다.
 */
@Entity
@Table(name = "manager_groups")
public class ManagerGroup {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID platformId;

    @Column(nullable = false)
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "manager_group_permissions", joinColumns = @JoinColumn(name = "group_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false)
    private Set<ManagerPermission> permissions = EnumSet.noneOf(ManagerPermission.class);

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ManagerGroup() {
        // JPA only.
    }

    public ManagerGroup(UUID platformId, String name, Set<ManagerPermission> permissions) {
        this.platformId = platformId;
        this.name = name;
        this.permissions = copy(permissions);
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlatformId() {
        return platformId;
    }

    public String getName() {
        return name;
    }

    public Set<ManagerPermission> getPermissions() {
        return permissions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(String name, Set<ManagerPermission> permissions) {
        this.name = name;
        this.permissions.clear();
        this.permissions.addAll(permissions);
    }

    private static Set<ManagerPermission> copy(Set<ManagerPermission> source) {
        Set<ManagerPermission> set = EnumSet.noneOf(ManagerPermission.class);
        set.addAll(source);
        return set;
    }
}
