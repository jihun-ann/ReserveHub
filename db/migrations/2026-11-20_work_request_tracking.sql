-- 업무 요청 이력: 담당자 확인 시각, 추가 확인 요청 상태, 긴급 표시, 담당자가 정한 순서 (db/schema.sql에도 반영)
-- 여러 번 실행해도 안전하다.

ALTER TYPE work_request_status ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED';

ALTER TABLE work_requests ADD COLUMN IF NOT EXISTS read_at    TIMESTAMPTZ;
ALTER TABLE work_requests ADD COLUMN IF NOT EXISTS urgent     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE work_requests ADD COLUMN IF NOT EXISTS sort_order INTEGER;
