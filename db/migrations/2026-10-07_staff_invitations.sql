-- 강사/매니저 초대 테이블 추가 (db/schema.sql에도 같은 정의가 반영되어 있음)
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');

CREATE TABLE staff_invitations (
    id              UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id     UUID               NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    staff_role      staff_role         NOT NULL,
    manager_tier    manager_tier,
    email           VARCHAR(255),
    phone           VARCHAR(30),
    token           VARCHAR(64)        NOT NULL UNIQUE,
    status          invitation_status  NOT NULL DEFAULT 'PENDING',
    expires_at      TIMESTAMPTZ        NOT NULL,
    created_by      UUID               NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_sinv_platform ON staff_invitations(platform_id, status);
