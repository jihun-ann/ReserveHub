-- 플랫폼 공개 ID(code): 숫자 0-9 + 영문 대문자 A-Z 6자리 (db/schema.sql에도 같은 정의가 반영되어 있음)
-- 내부 기본키 id(UUID)는 그대로 두고, 사용자가 쓰는 ID만 따로 둔다.
ALTER TABLE platforms ADD COLUMN code VARCHAR(6);

-- 기존 플랫폼마다 겹치지 않는 코드를 무작위로 채운다.
DO $$
DECLARE
    r RECORD;
    c TEXT;
    chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
BEGIN
    FOR r IN SELECT id FROM platforms WHERE code IS NULL LOOP
        LOOP
            c := (SELECT string_agg(substr(chars, 1 + floor(random() * 36)::int, 1), '') FROM generate_series(1, 6));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM platforms WHERE code = c);
        END LOOP;
        UPDATE platforms SET code = c WHERE id = r.id;
    END LOOP;
END $$;

ALTER TABLE platforms ALTER COLUMN code SET NOT NULL;
ALTER TABLE platforms ADD CONSTRAINT uq_platforms_code UNIQUE (code);
ALTER TABLE platforms ADD CONSTRAINT chk_platforms_code CHECK (code ~ '^[0-9A-Z]{6}$');
