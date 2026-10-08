-- 내 정보 확장: 생년월일, 이메일/연락처 인증, 계정 비활성화 시 이메일 재사용 (db/schema.sql에도 같은 정의가 반영되어 있음)
ALTER TABLE users ADD COLUMN birth_date DATE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMPTZ;

-- 이메일 유일 제약을 '활성 계정끼리만'으로 바꾼다. 아이디(username) 유일 제약은 그대로 둔다.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX uq_users_email_active ON users(email) WHERE is_active;

CREATE TABLE contact_verifications (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel       VARCHAR(10)  NOT NULL,
    target        VARCHAR(255) NOT NULL,
    code_hash     VARCHAR(64)  NOT NULL,
    attempts      INT          NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cv_user ON contact_verifications(user_id, channel);
