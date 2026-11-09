-- 매니저 초대에 배정할 그룹을 함께 저장 (db/schema.sql에도 같은 정의가 반영되어 있음)
-- 수락하는 순간 이 그룹에 들어간다. 초대 대기 중 그룹이 지워지면 NULL로 돌아가 그룹 없이 배정된다.
ALTER TABLE staff_invitations
    ADD COLUMN manager_group_id UUID REFERENCES manager_groups(id) ON DELETE SET NULL;
