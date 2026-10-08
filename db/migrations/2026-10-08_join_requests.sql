-- 회원 가입 신청 (db/schema.sql에도 같은 정의가 반영되어 있음)
ALTER TYPE action_target ADD VALUE IF NOT EXISTS 'JOIN_REQUEST';

-- 회원이 플랫폼에 보낸 가입 신청 — 센터가 승인/반려하고, 승인 뒤에 수강권/프로그램을 등록한다.
CREATE TYPE join_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE platform_join_requests (
                                        id             UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
                                        platform_id    UUID                 NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                        user_id        UUID                 NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
                                        status         join_request_status  NOT NULL DEFAULT 'PENDING',
                                        message        TEXT,
                                        decided_by     UUID                 REFERENCES users(id),
                                        decision_memo  TEXT,
                                        created_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
                                        decided_at     TIMESTAMPTZ
);

-- 같은 플랫폼에 대기 중인 신청은 사용자당 하나만
CREATE UNIQUE INDEX uq_join_request_pending ON platform_join_requests(platform_id, user_id) WHERE status = 'PENDING';
CREATE INDEX idx_join_request_platform ON platform_join_requests(platform_id, status);
CREATE INDEX idx_join_request_user ON platform_join_requests(user_id);

-- 새 권한 JOIN_REQUEST_MANAGE(가입 신청 처리): 강사 초대/삭제 권한이 있던 그룹(관리자/임원)에 함께 준다.
INSERT INTO manager_group_permissions (group_id, permission)
SELECT group_id, 'JOIN_REQUEST_MANAGE' FROM manager_group_permissions WHERE permission = 'TUTOR_MANAGE';
