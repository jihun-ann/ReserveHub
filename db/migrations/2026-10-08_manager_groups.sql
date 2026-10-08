-- 플랫폼별 매니저 그룹 (db/schema.sql에도 같은 정의가 반영되어 있음)
-- 그룹 = 이름 + 권한 등급(manager_tier). 권한 검사는 기존 platform_staff.manager_tier를 그대로 쓰고,
-- 그룹을 바꾸면 그 등급이 함께 반영된다.
CREATE TABLE manager_groups (
    id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id   UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    name          VARCHAR(50)   NOT NULL,
    manager_tier  manager_tier  NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (platform_id, name)
);

ALTER TABLE platform_staff ADD COLUMN manager_group_id UUID REFERENCES manager_groups(id);

-- 기존 플랫폼마다 기본 그룹 3개를 만들고, 기존 매니저는 자기 등급과 같은 그룹에 넣는다.
INSERT INTO manager_groups (platform_id, name, manager_tier)
SELECT p.id, g.name, g.tier::manager_tier
FROM platforms p
CROSS JOIN (VALUES ('일반', 'LOW'), ('관리자', 'MEDIUM'), ('임원', 'HIGH')) AS g(name, tier);

UPDATE platform_staff s
SET manager_group_id = g.id
FROM manager_groups g
WHERE s.staff_role = 'MANAGER'
  AND g.platform_id = s.platform_id
  AND g.manager_tier = s.manager_tier;
