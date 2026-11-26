-- 플랫폼 개설 신청 + 서비스 운영자(ADMIN) 역할 (db/schema.sql에도 같은 정의가 반영되어 있음)
-- ALTER TYPE ... ADD VALUE는 트랜잭션 블록 안에서 새 값을 바로 쓸 수 없으므로 이 파일은 그대로 psql -f로 실행한다.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

CREATE TYPE platform_application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE platform_applications (
                                       id                        UUID                         PRIMARY KEY DEFAULT uuid_generate_v4(),
                                       applicant_id              UUID                         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                       name                      VARCHAR(100)                 NOT NULL,
                                       business_type             business_type                NOT NULL,
                                       phone                     VARCHAR(20),
                                       address                   TEXT,
                                       description               TEXT,
                                       business_number           VARCHAR(10)                  NOT NULL CHECK (business_number ~ '^[0-9]{10}$'),
                                       certificate_original_name TEXT                         NOT NULL,
                                       certificate_stored_path   TEXT                         NOT NULL,
                                       certificate_content_type  VARCHAR(100),
                                       status                    platform_application_status  NOT NULL DEFAULT 'PENDING',
                                       decided_by                UUID                         REFERENCES users(id),
                                       decision_memo             TEXT,
                                       platform_id               UUID                         REFERENCES platforms(id) ON DELETE SET NULL,
                                       created_at                TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
                                       decided_at                TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_platform_application_pending ON platform_applications(business_number) WHERE status = 'PENDING';
CREATE INDEX idx_platform_application_status ON platform_applications(status, created_at);
CREATE INDEX idx_platform_application_applicant ON platform_applications(applicant_id);
