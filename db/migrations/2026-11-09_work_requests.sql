-- 재무 일정(financial_requests) → 업무 요청(work_requests) (db/schema.sql에도 같은 정의가 반영되어 있음)
-- 옛 테이블은 그대로 두고 새 테이블에 복사한다 — 같은 DB를 쓰는 옛 서버가 배포 전까지 계속 동작하도록.
-- 여러 번 실행해도 안전하다(이미 옮긴 행은 건너뜀). 새 서버 배포 직후 한 번 더 실행해 그 사이 쌓인 재무 일정을 옮기고,
-- 옛 서버가 다 내려간 뒤 2026-11-09_drop_financial_requests.sql 로 옛 테이블을 지운다.

DO $$ BEGIN
    CREATE TYPE work_request_status AS ENUM ('REQUESTED', 'IN_PROGRESS', 'DONE', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS work_requests (
    id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id     UUID                  NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    requested_by    UUID                  NOT NULL REFERENCES users(id),
    assignee_id     UUID                  NOT NULL REFERENCES users(id),
    title           VARCHAR(200)          NOT NULL,
    memo            TEXT,
    due_date        DATE,
    status          work_request_status   NOT NULL DEFAULT 'REQUESTED',
    created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_request_comments (
    id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id               UUID         NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
    author_id                UUID         NOT NULL REFERENCES users(id),
    content                  TEXT,
    attachment_original_name VARCHAR(255),
    attachment_stored_path   VARCHAR(500),
    attachment_content_type  VARCHAR(100),
    attachment_size_bytes    BIGINT,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wreq_platform    ON work_requests(platform_id, status);
CREATE INDEX IF NOT EXISTS idx_wreq_assignee    ON work_requests(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_wreq_comment_req ON work_request_comments(request_id);

-- 옛 재무 일정 옮기기: 담당자는 플랫폼 오너, 대기 → 요청됨 / 승인 → 완료 / 반려 → 취소.
-- 유형과 처리 메모는 메모 앞뒤에 붙여 남긴다.
INSERT INTO work_requests (id, platform_id, requested_by, assignee_id, title, memo, due_date, status, created_at, updated_at)
SELECT f.id, f.platform_id, f.requested_by, p.created_by, f.title,
       concat_ws(E'\n',
                 '[' || CASE f.type WHEN 'PAYDAY' THEN '급여일' WHEN 'EXPENSE' THEN '지출 예정일' ELSE '명세서 제출' END || ']',
                 f.memo,
                 CASE WHEN f.decision_memo IS NOT NULL THEN '처리 메모: ' || f.decision_memo END),
       f.event_date,
       CASE f.status WHEN 'PENDING' THEN 'REQUESTED' WHEN 'APPROVED' THEN 'DONE' ELSE 'CANCELED' END::work_request_status,
       f.created_at, f.updated_at
FROM financial_requests f
JOIN platforms p ON p.id = f.platform_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_request_comments (id, request_id, author_id, content, attachment_original_name, attachment_stored_path,
                                   attachment_content_type, attachment_size_bytes, created_at)
SELECT c.id, c.request_id, c.author_id, c.content, c.attachment_original_name, c.attachment_stored_path,
       c.attachment_content_type, c.attachment_size_bytes, c.created_at
FROM financial_request_comments c
WHERE EXISTS (SELECT 1 FROM work_requests w WHERE w.id = c.request_id)
ON CONFLICT (id) DO NOTHING;
