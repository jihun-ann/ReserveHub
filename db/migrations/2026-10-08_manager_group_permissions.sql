-- 매니저 그룹을 L/M/H 등급 대신 메뉴/기능 권한 목록으로 전환 (db/schema.sql에도 같은 정의가 반영되어 있음)
CREATE TABLE manager_group_permissions (
    group_id    UUID         NOT NULL REFERENCES manager_groups(id) ON DELETE CASCADE,
    permission  VARCHAR(40)  NOT NULL,
    PRIMARY KEY (group_id, permission)
);

-- 기존 동작을 그대로 유지하도록 등급별로 권한을 옮긴다.
-- 모든 그룹: 매니저 메뉴 전부 (예전엔 등급과 무관하게 메뉴가 다 보였다)
INSERT INTO manager_group_permissions (group_id, permission)
SELECT g.id, m.p
FROM manager_groups g
CROSS JOIN (VALUES ('MENU_APPROVAL'), ('MENU_MEMBERS'), ('MENU_TUTOR'), ('MENU_LESSON'), ('MENU_FACILITY_STATUS'),
                   ('MENU_PAYMENT'), ('MENU_PAYMENT_HISTORY'), ('MENU_CALC'), ('MENU_HISTORY'), ('MENU_ACTIVITY_LOG')) AS m(p);

-- MEDIUM 이상: 시설 처리, 프로그램 운영, 강사 초대/삭제
INSERT INTO manager_group_permissions (group_id, permission)
SELECT g.id, f.p
FROM manager_groups g
CROSS JOIN (VALUES ('FACILITY_MANAGE'), ('PROGRAM_MANAGE'), ('TUTOR_MANAGE')) AS f(p)
WHERE g.manager_tier IN ('MEDIUM', 'HIGH');

-- HIGH: 매니저/그룹 관리, 재무·휴가 승인, 할인정책, 환불
INSERT INTO manager_group_permissions (group_id, permission)
SELECT g.id, f.p
FROM manager_groups g
CROSS JOIN (VALUES ('MANAGER_MANAGE'), ('FINANCIAL_APPROVE'), ('LEAVE_APPROVE'), ('DISCOUNT_POLICY'), ('REFUND')) AS f(p)
WHERE g.manager_tier = 'HIGH';

ALTER TABLE manager_groups DROP COLUMN manager_tier;
