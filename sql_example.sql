-- ============================================================
-- ReserveHub Database Schema
-- DB: PostgreSQL 16
-- Encoding: UTF-8
-- ============================================================

-- ── 확장 ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 계정 / 권한 도메인
-- ============================================================

-- 역할 (SUPER > SUB_SUPER > ADMIN > USER)
CREATE TYPE user_role AS ENUM (
    'SUPER',        -- 슈퍼관리자 (대표)
    'SUB_SUPER',    -- 서브슈퍼관리자 (점주/사장)
    'ADMIN',        -- 일반관리자 (강사)
    'USER'          -- 수강생
);

CREATE TABLE users (
                       id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email           VARCHAR(255) NOT NULL UNIQUE,
                       password_hash   TEXT        NOT NULL,
                       name            VARCHAR(100) NOT NULL,
                       phone           VARCHAR(20),
                       role            user_role   NOT NULL DEFAULT 'USER',
                       profile_image   TEXT,
                       is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                       last_login_at   TIMESTAMPTZ,
                       created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users              IS '전체 사용자 계정. role 컬럼으로 역할을 구분';
COMMENT ON COLUMN users.role         IS 'SUPER/SUB_SUPER/ADMIN/USER — 계층 구조 반영';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash (cost 12)';


-- ============================================================
-- 2. 플랫폼 도메인
-- ============================================================

CREATE TYPE platform_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE business_type   AS ENUM ('PILATES', 'YOGA', 'MUSIC', 'FITNESS', 'DANCE', 'OTHER');

CREATE TABLE platforms (
                           id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                           name            VARCHAR(200)    NOT NULL,
                           business_type   business_type   NOT NULL,
                           phone           VARCHAR(20),
                           address         TEXT,
                           description     TEXT,
                           emoji           VARCHAR(10)     DEFAULT '🏢',
                           color_hex       VARCHAR(7)      DEFAULT '#7c6af7',
                           status          platform_status NOT NULL DEFAULT 'ACTIVE',
                           created_by      UUID            NOT NULL REFERENCES users(id),
                           created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                           updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platforms IS '플랫폼 (스튜디오/센터 단위). 슈퍼관리자만 생성 가능';


-- 플랫폼 ↔ 스태프 N:M (서브슈퍼·강사 모두 이 테이블로 관리)
-- 서브슈퍼: 플랫폼 1개 고정 (UI 확정), 강사: 복수 플랫폼 가능
CREATE TYPE staff_role AS ENUM ('SUB_SUPER', 'ADMIN');

CREATE TABLE platform_staff (
                                id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                user_id         UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
                                staff_role      staff_role  NOT NULL,
                                is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                                joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                left_at         TIMESTAMPTZ,                         -- 퇴사/해제 시각
                                UNIQUE (platform_id, user_id)
);

COMMENT ON TABLE  platform_staff           IS '플랫폼-스태프 매핑. SUB_SUPER는 1개 플랫폼만 허용 (앱 레이어에서 검증)';
COMMENT ON COLUMN platform_staff.left_at   IS 'NULL이면 재직 중. Soft delete 방식으로 이력 보존';


-- ============================================================
-- 3. 프로그램 / 슬롯 도메인
-- ============================================================

CREATE TYPE program_type AS ENUM ('GROUP', 'PRIVATE', 'SEMIPRIVATE');

CREATE TABLE programs (
                          id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                          platform_id     UUID            NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                          name            VARCHAR(200)    NOT NULL,
                          type            program_type    NOT NULL DEFAULT 'GROUP',
                          capacity        SMALLINT        NOT NULL DEFAULT 8 CHECK (capacity >= 1),
                          duration_min    SMALLINT        NOT NULL DEFAULT 60 CHECK (duration_min > 0),
                          description     TEXT,
                          is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
                          created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                          updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE programs IS '수업 프로그램 (그룹반 A, 1:1 개인레슨 등)';


-- 정기 슬롯 (요일·시간 기반 반복 일정)
CREATE TYPE day_of_week AS ENUM ('MON','TUE','WED','THU','FRI','SAT','SUN');

CREATE TABLE slots (
                       id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       program_id      UUID        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
                       instructor_id   UUID        NOT NULL REFERENCES users(id),     -- ADMIN role
                       day_of_week     day_of_week NOT NULL,
                       start_time      TIME        NOT NULL,
                       end_time        TIME        NOT NULL,
                       valid_from      DATE        NOT NULL DEFAULT CURRENT_DATE,
                       valid_until     DATE,                                           -- NULL = 무기한
                       is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                       created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       CONSTRAINT chk_slot_time CHECK (end_time > start_time)
);

COMMENT ON TABLE  slots             IS '정기 슬롯. valid_from~valid_until 기간 동안 매주 반복';
COMMENT ON COLUMN slots.valid_until IS 'NULL이면 종료일 없음';


-- ============================================================
-- 4. 수강권 / 할인 / 결제 도메인
-- ============================================================

CREATE TYPE pass_type AS ENUM ('MONTHLY', 'SESSION', 'DAILY', 'CUSTOM');

CREATE TABLE passes (
                        id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                        platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                        name            VARCHAR(200) NOT NULL,
                        type            pass_type   NOT NULL,
                        price           INT         NOT NULL CHECK (price >= 0),       -- 원 단위
                        session_count   SMALLINT,                                       -- SESSION 타입만 사용
                        valid_days      SMALLINT    NOT NULL DEFAULT 30 CHECK (valid_days > 0),
                        is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  passes               IS '수강권 상품 정의';
COMMENT ON COLUMN passes.session_count IS 'MONTHLY/DAILY는 NULL, SESSION 타입은 횟수 입력';


-- 할인 정책
CREATE TYPE discount_type AS ENUM (
    'LONG_TERM',    -- 장기 등록 (기간 조건)
    'FAMILY',       -- 가족 등록 (인원 조건)
    'PROMOTION',    -- 기간 한정 프로모션
    'COUPON',       -- 쿠폰 코드
    'MANUAL'        -- 직접 입력 (상담 시)
);

CREATE TABLE discount_policies (
                                   id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   platform_id     UUID            NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                   name            VARCHAR(200)    NOT NULL,
                                   type            discount_type   NOT NULL,
                                   rate            NUMERIC(5,2)    NOT NULL CHECK (rate > 0 AND rate <= 100), -- %
                                   condition_value INT,            -- 장기: 개월 수, 가족: 인원 수, 쿠폰: NULL
                                   coupon_code     VARCHAR(50)     UNIQUE,
                                   expires_at      TIMESTAMPTZ,    -- NULL = 무기한
                                   is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
                                   memo            TEXT,
                                   created_by      UUID            NOT NULL REFERENCES users(id),
                                   created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                   updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  discount_policies                IS '할인 정책 정의. 서브슈퍼가 플랫폼별로 설정';
COMMENT ON COLUMN discount_policies.condition_value IS 'LONG_TERM: 최소 개월수, FAMILY: 최소 인원수';
COMMENT ON COLUMN discount_policies.rate            IS '할인율(%). 순차 적용 시 각 단계에서 독립 계산';


-- 주문 (장바구니 → 결제 단위)
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

CREATE TABLE orders (
                        id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id         UUID            NOT NULL REFERENCES users(id),
                        platform_id     UUID            NOT NULL REFERENCES platforms(id),
                        status          order_status    NOT NULL DEFAULT 'PENDING',
                        original_amount INT             NOT NULL DEFAULT 0,  -- 할인 전 합계
                        discount_amount INT             NOT NULL DEFAULT 0,  -- 총 할인액
                        final_amount    INT             NOT NULL DEFAULT 0,  -- 실 결제액
                        paid_at         TIMESTAMPTZ,
                        memo            TEXT,
                        created_by      UUID            REFERENCES users(id), -- 상담 처리한 스태프 (NULL = 자기 결제)
                        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                        updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                        CONSTRAINT chk_amount CHECK (final_amount >= 0)
);

COMMENT ON TABLE  orders              IS '결제 주문. 여러 수강권을 묶어 한 번에 결제';
COMMENT ON COLUMN orders.created_by   IS '스태프가 상담 후 대신 등록 시 해당 스태프 ID';


-- 주문 항목 (수강권 × 수량)
CREATE TABLE order_items (
                             id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                             order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                             pass_id         UUID        NOT NULL REFERENCES passes(id),
                             quantity        SMALLINT    NOT NULL DEFAULT 1 CHECK (quantity >= 1),
                             unit_price      INT         NOT NULL,    -- 주문 시점 가격 스냅샷
                             line_total      INT         NOT NULL     -- quantity × unit_price (할인 전)
);

COMMENT ON TABLE order_items IS '주문 내 수강권 항목. 다중 수강권 지원';


-- 할인 적용 이력 (순차 적용 순서 보존)
CREATE TABLE order_discounts (
                                 id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 order_id        UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                 policy_id       UUID    REFERENCES discount_policies(id) ON DELETE SET NULL,
                                 policy_name     VARCHAR(200) NOT NULL,   -- 스냅샷 (정책 삭제 시에도 기록 보존)
                                 rate            NUMERIC(5,2) NOT NULL,
                                 base_amount     INT     NOT NULL,        -- 이 할인이 적용된 시점의 금액
                                 discount_amount INT     NOT NULL,        -- 실제 깎인 금액
                                 apply_order     SMALLINT NOT NULL,       -- 순차 적용 순서 (1, 2, 3...)
                                 CONSTRAINT chk_apply_order CHECK (apply_order >= 1)
);

COMMENT ON TABLE  order_discounts            IS '순차 할인 적용 이력. apply_order로 적용 순서 보존';
COMMENT ON COLUMN order_discounts.base_amount IS '이전 할인 적용 후 남은 금액 — 복리 할인 추적용';


-- 사용자 보유 수강권 (결제 완료 후 발급)
CREATE TYPE user_pass_status AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

CREATE TABLE user_passes (
                             id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
                             user_id         UUID                NOT NULL REFERENCES users(id),
                             order_item_id   UUID                NOT NULL REFERENCES order_items(id),
                             pass_id         UUID                NOT NULL REFERENCES passes(id),
                             platform_id     UUID                NOT NULL REFERENCES platforms(id),
                             sessions_total  INT,                -- NULL = 무제한 (월정액)
                             sessions_used   INT                 NOT NULL DEFAULT 0,
                             status          user_pass_status    NOT NULL DEFAULT 'ACTIVE',
                             started_at      DATE                NOT NULL DEFAULT CURRENT_DATE,
                             expires_at      DATE                NOT NULL,
                             created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
                             CONSTRAINT chk_sessions CHECK (sessions_used >= 0)
);

COMMENT ON TABLE  user_passes              IS '사용자가 실제 보유한 수강권 인스턴스';
COMMENT ON COLUMN user_passes.sessions_total IS 'NULL이면 기간 내 무제한 (MONTHLY 타입)';


-- ============================================================
-- 5. 예약 / 수업 / 출결 도메인
-- ============================================================

CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE reservations (
                              id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
                              user_id         UUID                NOT NULL REFERENCES users(id),
                              slot_id         UUID                NOT NULL REFERENCES slots(id),
                              user_pass_id    UUID                NOT NULL REFERENCES user_passes(id),
                              scheduled_date  DATE                NOT NULL,
                              status          reservation_status  NOT NULL DEFAULT 'CONFIRMED',
                              cancelled_at    TIMESTAMPTZ,
                              cancel_reason   TEXT,
                              created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
                              UNIQUE (user_id, slot_id, scheduled_date)   -- 동일 슬롯 중복 예약 방지
);

COMMENT ON TABLE reservations IS '개별 수업 예약. 슬롯 + 날짜로 실제 수업 인스턴스를 특정';


-- 수업 실적 (강사별 이력의 원천 데이터)
CREATE TABLE lessons (
                         id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                         slot_id         UUID        NOT NULL REFERENCES slots(id),
                         instructor_id   UUID        NOT NULL REFERENCES users(id),
                         platform_id     UUID        NOT NULL REFERENCES platforms(id),
                         program_id      UUID        NOT NULL REFERENCES programs(id),
                         lesson_date     DATE        NOT NULL,
                         started_at      TIMESTAMPTZ,
                         ended_at        TIMESTAMPTZ,
                         memo            TEXT,
                         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         UNIQUE (slot_id, lesson_date)
);

COMMENT ON TABLE lessons IS '실제 진행된 수업 실적. 수업 이력/통계의 원천';


-- 출결 (lesson ↔ user N:M)
CREATE TYPE attend_status AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

CREATE TABLE attendances (
                             id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                             lesson_id       UUID            NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                             user_id         UUID            NOT NULL REFERENCES users(id),
                             reservation_id  UUID            REFERENCES reservations(id),
                             status          attend_status   NOT NULL DEFAULT 'PRESENT',
                             checked_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                             checked_by      UUID            REFERENCES users(id),   -- 출결 처리한 강사/스태프
                             memo            TEXT,
                             UNIQUE (lesson_id, user_id)
);

COMMENT ON TABLE  attendances           IS '수업별 출결 기록';
COMMENT ON COLUMN attendances.checked_by IS '출결 처리자 (강사 또는 스태프)';


-- ============================================================
-- 6. 일정 변경 요청 / 처리 이력 도메인
-- ============================================================

CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE schedule_change_requests (
                                          id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                                          platform_id     UUID            NOT NULL REFERENCES platforms(id),
                                          requested_by    UUID            NOT NULL REFERENCES users(id),  -- 강사(ADMIN)
                                          reservation_id  UUID            NOT NULL REFERENCES reservations(id),
                                          original_date   DATE            NOT NULL,
                                          original_slot   UUID            NOT NULL REFERENCES slots(id),
                                          requested_date  DATE            NOT NULL,
                                          requested_slot  UUID            REFERENCES slots(id),           -- NULL = 슬롯 외 시간
                                          reason          TEXT,
                                          status          request_status  NOT NULL DEFAULT 'PENDING',
                                          created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                          updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schedule_change_requests IS '강사가 제출한 일정 변경 요청. 서브슈퍼 또는 슈퍼가 승인';


-- 처리 이력 (모든 승인/반려 행위 기록 — 담당자 추적)
CREATE TYPE action_target AS ENUM (
    'SCHEDULE_REQUEST',  -- 일정 변경 요청
    'MEMBER_MEMO',       -- 회원 상담 메모
    'STAFF_CHANGE',      -- 강사 등록/변경
    'PASS_REFUND',       -- 수강권 환불
    'PLATFORM_CHANGE'    -- 플랫폼 설정 변경
);

CREATE TABLE action_logs (
                             id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                             platform_id     UUID            REFERENCES platforms(id),
                             actor_id        UUID            NOT NULL REFERENCES users(id),  -- 처리한 스태프
                             target_type     action_target   NOT NULL,
                             target_id       UUID            NOT NULL,                        -- 대상 레코드 ID
                             action          VARCHAR(50)     NOT NULL,  -- 'APPROVE', 'REJECT', 'CREATE', 'UPDATE' 등
                             memo            TEXT,
                             created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  action_logs         IS '모든 처리 이력. 담당자 + 시각 자동 기록. 삭제 불가';
COMMENT ON COLUMN action_logs.actor_id IS '처리한 SUB_SUPER 또는 SUPER';
COMMENT ON COLUMN action_logs.target_id IS '대상 레코드 UUID (target_type에 따라 다른 테이블 참조)';


-- 회원 상담 메모 (회원 상세 패널에서 기록)
CREATE TABLE member_memos (
                              id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                              platform_id     UUID        NOT NULL REFERENCES platforms(id),
                              user_id         UUID        NOT NULL REFERENCES users(id),   -- 수강생
                              author_id       UUID        NOT NULL REFERENCES users(id),   -- 작성 스태프
                              content         TEXT        NOT NULL,
                              created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE member_memos IS '수강생별 상담 및 처리 메모. 작성자(스태프) 추적';


-- ============================================================
-- 7. 캘린더 / 공유 이벤트 도메인
-- ============================================================

CREATE TYPE event_type AS ENUM (
    'HOLIDAY',      -- 정기 휴무
    'NOTICE',       -- 플랫폼 공지
    'HQ_NOTICE',    -- 본사(슈퍼) 공지
    'SHARED',       -- 서브슈퍼 간 공유 이벤트
    'CONFLICT'      -- 강사 일정 충돌 (시스템 자동 생성)
);

CREATE TYPE share_scope AS ENUM (
    'PLATFORM',         -- 해당 플랫폼 내
    'ALL_SUB_SUPER',    -- 전체 서브슈퍼
    'INCLUDE_SUPER',    -- 슈퍼 포함
    'INCLUDE_ADMIN'     -- 강사 포함
);

CREATE TABLE calendar_events (
                                 id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 platform_id     UUID        REFERENCES platforms(id) ON DELETE CASCADE,  -- NULL = 전사
                                 type            event_type  NOT NULL,
                                 title           VARCHAR(300) NOT NULL,
                                 description     TEXT,
                                 event_date      DATE        NOT NULL,
                                 event_end_date  DATE,                   -- NULL = 단일 일정
                                 all_day         BOOLEAN     NOT NULL DEFAULT TRUE,
                                 share_scope     share_scope NOT NULL DEFAULT 'PLATFORM',
                                 created_by      UUID        NOT NULL REFERENCES users(id),
                                 created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  calendar_events            IS '캘린더 이벤트. platform_id가 NULL이면 전 플랫폼 공통';
COMMENT ON COLUMN calendar_events.event_type IS 'HQ_NOTICE는 슈퍼만 생성 가능 (앱 레이어 검증)';


-- ============================================================
-- 8. 인덱스 전략
-- ============================================================

-- users
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);

-- platform_staff
CREATE INDEX idx_pstaff_platform   ON platform_staff(platform_id);
CREATE INDEX idx_pstaff_user       ON platform_staff(user_id);

-- programs / slots
CREATE INDEX idx_programs_platform ON programs(platform_id);
CREATE INDEX idx_slots_program     ON slots(program_id);
CREATE INDEX idx_slots_instructor  ON slots(instructor_id);
CREATE INDEX idx_slots_day         ON slots(day_of_week);

-- passes / discount_policies
CREATE INDEX idx_passes_platform   ON passes(platform_id);
CREATE INDEX idx_discounts_platform ON discount_policies(platform_id);
CREATE INDEX idx_discounts_type    ON discount_policies(type);

-- orders / order_items / order_discounts
CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_platform   ON orders(platform_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_paid_at    ON orders(paid_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_disc_order  ON order_discounts(order_id);

-- user_passes
CREATE INDEX idx_upasses_user      ON user_passes(user_id);
CREATE INDEX idx_upasses_platform  ON user_passes(platform_id);
CREATE INDEX idx_upasses_status    ON user_passes(status);
CREATE INDEX idx_upasses_expires   ON user_passes(expires_at);   -- 재결제 임박 쿼리용

-- reservations
CREATE INDEX idx_reserv_user       ON reservations(user_id);
CREATE INDEX idx_reserv_slot_date  ON reservations(slot_id, scheduled_date);
CREATE INDEX idx_reserv_status     ON reservations(status);

-- lessons
CREATE INDEX idx_lessons_instructor ON lessons(instructor_id);
CREATE INDEX idx_lessons_platform  ON lessons(platform_id);
CREATE INDEX idx_lessons_date      ON lessons(lesson_date DESC);  -- 수업 이력 조회용

-- attendances
CREATE INDEX idx_attend_lesson     ON attendances(lesson_id);
CREATE INDEX idx_attend_user       ON attendances(user_id);

-- schedule_change_requests
CREATE INDEX idx_scr_platform      ON schedule_change_requests(platform_id);
CREATE INDEX idx_scr_status        ON schedule_change_requests(status);
CREATE INDEX idx_scr_requested_by  ON schedule_change_requests(requested_by);

-- action_logs
CREATE INDEX idx_alog_platform     ON action_logs(platform_id);
CREATE INDEX idx_alog_actor        ON action_logs(actor_id);
CREATE INDEX idx_alog_target       ON action_logs(target_type, target_id);
CREATE INDEX idx_alog_created      ON action_logs(created_at DESC);

-- member_memos
CREATE INDEX idx_memos_user        ON member_memos(user_id);
CREATE INDEX idx_memos_platform    ON member_memos(platform_id);

-- calendar_events
CREATE INDEX idx_cal_platform_date ON calendar_events(platform_id, event_date);
CREATE INDEX idx_cal_type          ON calendar_events(type);


-- ============================================================
-- 9. 자주 쓰는 View
-- ============================================================

-- 재결제 임박 고객 (D-7 이내)
CREATE VIEW vw_expiring_passes AS
SELECT
    up.id,
    up.user_id,
    u.name              AS user_name,
    u.phone,
    up.platform_id,
    p.name              AS pass_name,
    up.expires_at,
    (up.expires_at - CURRENT_DATE) AS days_left
FROM user_passes up
         JOIN users    u ON u.id = up.user_id
         JOIN passes   p ON p.id = up.pass_id
WHERE up.status = 'ACTIVE'
  AND up.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY up.expires_at ASC;

COMMENT ON VIEW vw_expiring_passes IS 'D-7 이내 만료 수강권. 대시보드 재결제 임박 위젯용';


-- 강사별 월간 수업 집계
CREATE VIEW vw_instructor_monthly_stats AS
SELECT
    l.instructor_id,
    u.name                              AS instructor_name,
    l.platform_id,
    DATE_TRUNC('month', l.lesson_date)  AS month,
    COUNT(*)                            AS lesson_count,
    COUNT(*) FILTER (WHERE pr.type = 'GROUP')   AS group_count,
    COUNT(*) FILTER (WHERE pr.type = 'PRIVATE') AS private_count,
    SUM(a.total_students)               AS total_students,
    SUM(a.attended)                     AS total_attended,
    ROUND(
        SUM(a.attended)::NUMERIC / NULLIF(SUM(a.total_students), 0) * 100, 1
    )                                   AS attend_rate
FROM lessons l
JOIN users    u  ON u.id  = l.instructor_id
JOIN programs pr ON pr.id = l.program_id
LEFT JOIN (
    SELECT
        lesson_id,
        COUNT(*)                                        AS total_students,
        COUNT(*) FILTER (WHERE status = 'PRESENT')      AS attended
    FROM attendances
    GROUP BY lesson_id
) a ON a.lesson_id = l.id
GROUP BY l.instructor_id, u.name, l.platform_id, DATE_TRUNC('month', l.lesson_date);

COMMENT ON VIEW vw_instructor_monthly_stats IS '강사별 월간 수업 집계. 수업이력 페이지 및 대시보드용';


-- 플랫폼별 월간 매출
CREATE VIEW vw_platform_monthly_revenue AS
SELECT
    o.platform_id,
    p.name                              AS platform_name,
    DATE_TRUNC('month', o.paid_at)      AS month,
    COUNT(*)                            AS order_count,
    SUM(o.original_amount)              AS original_revenue,
    SUM(o.discount_amount)              AS total_discount,
    SUM(o.final_amount)                 AS net_revenue
FROM orders o
JOIN platforms p ON p.id = o.platform_id
WHERE o.status = 'PAID'
GROUP BY o.platform_id, p.name, DATE_TRUNC('month', o.paid_at);

COMMENT ON VIEW vw_platform_monthly_revenue IS '플랫폼별 월간 매출 집계. 슈퍼/서브슈퍼 대시보드용';


-- ============================================================
-- 10. 핵심 비즈니스 규칙 체크 함수
-- ============================================================

-- 서브슈퍼는 1개 플랫폼만 담당 가능 (INSERT/UPDATE 시 검증)
CREATE OR REPLACE FUNCTION check_subsup_single_platform()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.staff_role = 'SUB_SUPER' THEN
        IF EXISTS (
            SELECT 1 FROM platform_staff
            WHERE user_id    = NEW.user_id
              AND staff_role = 'SUB_SUPER'
              AND is_active  = TRUE
              AND id         != NEW.id
        ) THEN
            RAISE EXCEPTION
                '서브슈퍼관리자는 1개 플랫폼만 담당할 수 있습니다. (user_id: %)', NEW.user_id;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subsup_single_platform
    BEFORE INSERT OR UPDATE ON platform_staff
                         FOR EACH ROW EXECUTE FUNCTION check_subsup_single_platform();


-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_platforms_updated_at       BEFORE UPDATE ON platforms          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_programs_updated_at        BEFORE UPDATE ON programs           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_passes_updated_at          BEFORE UPDATE ON passes             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_discount_updated_at        BEFORE UPDATE ON discount_policies  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at          BEFORE UPDATE ON orders             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_scr_updated_at             BEFORE UPDATE ON schedule_change_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cal_updated_at             BEFORE UPDATE ON calendar_events    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 11. Transactional Outbox Pattern
-- ============================================================
-- 목적: DB 트랜잭션과 외부 이벤트 발행(Kafka/Redis/알림 등)을
--       원자적으로 처리. 이벤트 유실·중복 발행 방지.
--
-- 흐름:
--   [Service] → INSERT outbox_events (같은 트랜잭션)
--             → COMMIT
--   [Relay Worker] → SELECT FOR UPDATE SKIP LOCKED
--                  → 외부 시스템으로 발행
--                  → UPDATE status = 'SENT'
-- ============================================================

CREATE TYPE outbox_status AS ENUM (
    'PENDING',      -- 발행 대기
    'SENT',         -- 발행 완료
    'FAILED',       -- 최종 실패 (max_retries 초과)
    'SKIPPED'       -- 수동 무시 처리
);

CREATE TABLE outbox_events (
                               id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 이벤트 식별
                               aggregate_type  VARCHAR(100)    NOT NULL,   -- 'ORDER', 'RESERVATION', 'USER', ...
                               aggregate_id    UUID            NOT NULL,   -- 해당 도메인 레코드 ID
                               event_type      VARCHAR(200)    NOT NULL,   -- 'order.paid', 'reservation.cancelled', ...
                               topic           VARCHAR(200)    NOT NULL,   -- Kafka topic 또는 Redis channel

    -- 페이로드
                               payload         JSONB           NOT NULL,   -- 이벤트 전체 데이터 스냅샷
                               headers         JSONB           NOT NULL DEFAULT '{}', -- 메타 (trace-id, 발행자 등)

    -- 발행 상태
                               status          outbox_status   NOT NULL DEFAULT 'PENDING',
                               retry_count     SMALLINT        NOT NULL DEFAULT 0,
                               max_retries     SMALLINT        NOT NULL DEFAULT 5,
                               last_error      TEXT,                       -- 마지막 실패 원인
                               scheduled_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),   -- 발행 예정 시각 (지연 발행 지원)
                               sent_at         TIMESTAMPTZ,                -- 실제 발행 시각

                               created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  outbox_events              IS 'Transactional Outbox. 비즈니스 트랜잭션과 이벤트 발행을 원자적으로 보장';
COMMENT ON COLUMN outbox_events.aggregate_type IS '이벤트 발행 주체 도메인 (ORDER/RESERVATION/USER 등)';
COMMENT ON COLUMN outbox_events.event_type   IS '도메인 이벤트명. 컨벤션: <aggregate>.<action> (소문자)';
COMMENT ON COLUMN outbox_events.topic        IS 'Kafka topic 또는 Redis Pub/Sub channel 이름';
COMMENT ON COLUMN outbox_events.payload      IS '발행 시점 스냅샷. 이후 원본 레코드 변경과 무관하게 재현 가능';
COMMENT ON COLUMN outbox_events.scheduled_at IS 'Relay가 이 시각 이후에만 발행 시도. 지연 발행(Delay)에 활용';
COMMENT ON COLUMN outbox_events.headers      IS 'X-Trace-Id, X-Source-Service 등 메타데이터';


-- Relay Worker 핵심 쿼리용 복합 인덱스
-- SKIP LOCKED 패턴: 여러 Worker 인스턴스가 충돌 없이 병렬 처리
CREATE INDEX idx_outbox_relay
    ON outbox_events (status, scheduled_at)
    WHERE status = 'PENDING';                  -- Partial index: PENDING만 스캔

CREATE INDEX idx_outbox_aggregate
    ON outbox_events (aggregate_type, aggregate_id);

CREATE INDEX idx_outbox_created
    ON outbox_events (created_at DESC);


-- ── 이벤트 타입 레퍼런스 ────────────────────────────────────
-- 아래는 시스템에서 발행되는 전체 이벤트 목록 (주석 문서)
--
-- [계정]
--   user.registered         회원가입 완료       → 환영 메일
--   user.password_changed   비밀번호 변경       → 보안 알림
--
-- [예약]
--   reservation.confirmed   예약 확정           → 사용자 알림
--   reservation.cancelled   예약 취소           → 사용자/강사 알림
--   reservation.no_show     노쇼 처리           → 수강권 차감 이벤트
--
-- [일정 변경 요청]
--   schedule_request.created   요청 생성        → 서브슈퍼 알림
--   schedule_request.approved  승인             → 강사/수강생 알림
--   schedule_request.rejected  반려             → 강사 알림
--
-- [결제]
--   order.paid              결제 완료           → 영수증 발송, 수강권 발급
--   order.refunded          환불 완료           → 사용자 알림
--   user_pass.expiring      수강권 D-7 만료     → 재결제 유도 알림
--   user_pass.expired       수강권 만료         → 상태 업데이트
--
-- [공유 이벤트]
--   calendar_event.shared   공유 일정 생성      → 해당 서브슈퍼 전원 알림
--   calendar_event.hq_notice 본사 공지          → 전 플랫폼 알림
--
-- [시스템]
--   slot.conflict_detected  강사 일정 충돌 감지 → 서브슈퍼 알림
-- ─────────────────────────────────────────────────────────────


-- Relay Worker 참고 쿼리 (실제 Worker 구현 시 사용)
-- BEGIN;
--   SELECT * FROM outbox_events
--    WHERE status = 'PENDING'
--      AND scheduled_at <= NOW()
--    ORDER BY scheduled_at ASC
--    LIMIT 100
--    FOR UPDATE SKIP LOCKED;
--
--   -- 외부 발행 성공 시:
--   UPDATE outbox_events
--      SET status = 'SENT', sent_at = NOW()
--    WHERE id = $1;
--
--   -- 실패 시 (재시도 가능):
--   UPDATE outbox_events
--      SET retry_count = retry_count + 1,
--          last_error  = $2,
--          scheduled_at = NOW() + (INTERVAL '1 minute' * POWER(2, retry_count)),
--          status = CASE WHEN retry_count + 1 >= max_retries THEN 'FAILED' ELSE 'PENDING' END
--    WHERE id = $1;
-- COMMIT;