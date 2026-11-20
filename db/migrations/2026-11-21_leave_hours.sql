-- 휴가 신청: 시간 단위 휴가 (db/schema.sql에도 반영). NULL이면 종일(연차), 1~7이면 그 시간만큼(하루짜리만).
-- 여러 번 실행해도 안전하다.

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS hours INTEGER CHECK (hours BETWEEN 1 AND 7);
