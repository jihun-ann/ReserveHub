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

-- 역할 (OWNER > MANAGER > TUTOR > USER, TAX_ACCOUNTANT는 계층과 무관한 계정 전역 역할)
CREATE TYPE user_role AS ENUM (
    'OWNER',          -- 오너 (대표)
    'MANAGER',        -- 매니저 (점주/사장)
    'TUTOR',          -- 강사
    'USER',           -- 수강생
    'TAX_ACCOUNTANT'  -- 세무사 — 오너가 초대한 플랫폼의 재무/정산 데이터만 조회 (platform_tax_accountants)
);

CREATE TABLE users (
                       id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       username              VARCHAR(50)  NOT NULL UNIQUE,
                       email                 VARCHAR(255) NOT NULL,                -- 활성 계정끼리만 유일 (아래 uq_users_email_active)
                       password_hash         TEXT        NOT NULL,
                       name                  VARCHAR(100) NOT NULL,
                       phone                 VARCHAR(20),
                       role                  user_role   NOT NULL DEFAULT 'USER',
                       profile_image         TEXT,
                       bank_name             VARCHAR(50),   -- 정산 계좌 — 본인이 마이페이지에서 등록
                       bank_account_number   VARCHAR(50),
                       bank_account_holder   VARCHAR(100),
                       guardian_name         VARCHAR(100),  -- 수강생 계정의 보호자 정보. 매니저가 입력/수정
                       guardian_phone        VARCHAR(20),
                       birth_date            DATE,          -- 생년월일 — 본인이 내 정보에서 입력
                       email_verified_at     TIMESTAMPTZ,   -- 이메일 인증 시각. 이메일이 바뀌면 NULL로 초기화
                       phone_verified_at     TIMESTAMPTZ,   -- 연락처 인증 시각. 연락처가 바뀌면 NULL로 초기화
                       is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
                       last_login_at         TIMESTAMPTZ,
                       created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users              IS '전체 사용자 계정. role 컬럼으로 역할을 구분';
COMMENT ON COLUMN users.username     IS '로그인 아이디 — 이메일과 별개, 통상적인 아이디 형식';
COMMENT ON COLUMN users.role         IS 'OWNER/MANAGER/TUTOR/USER/TAX_ACCOUNTANT';

-- 이메일은 활성(is_active) 계정끼리만 유일하다 — 탈퇴(비활성화)한 계정의 이메일은 다시 가입에 쓸 수 있다.
-- 아이디(username)는 비활성 계정까지 포함해 전체에서 유일하므로 탈퇴한 아이디는 재사용할 수 없다.
CREATE UNIQUE INDEX uq_users_email_active ON users(email) WHERE is_active;

-- 이메일/연락처 인증 코드 (코드는 해시로만 저장, 10분 유효, 5회 시도)
CREATE TABLE contact_verifications (
                       id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
                       user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       channel       VARCHAR(10)  NOT NULL,       -- EMAIL | PHONE
                       target        VARCHAR(255) NOT NULL,       -- 코드를 보낸 시점의 이메일/연락처
                       code_hash     VARCHAR(64)  NOT NULL,
                       attempts      INT          NOT NULL DEFAULT 0,
                       expires_at    TIMESTAMPTZ  NOT NULL,
                       created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cv_user ON contact_verifications(user_id, channel);
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash (cost 12)';
COMMENT ON COLUMN users.bank_name    IS '정산 계좌 은행명 — 세무사 조회용, 본인이 직접 등록';


-- ============================================================
-- 2. 플랫폼 도메인
-- ============================================================

CREATE TYPE platform_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE business_type   AS ENUM ('FITNESS', 'ARTS', 'EDUCATION', 'BEAUTY', 'OTHER');

CREATE TABLE platforms (
                           id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                           code            VARCHAR(6)      NOT NULL UNIQUE CHECK (code ~ '^[0-9A-Z]{6}$'),  -- 공개 ID: 숫자+영문 대문자 6자리
                           name            VARCHAR(200)    NOT NULL,
                           business_type   business_type   NOT NULL,
                           phone           VARCHAR(20),
                           address         TEXT,
                           description     TEXT,
                           color_hex       VARCHAR(7)      DEFAULT '#7c6af7',
                           status          platform_status NOT NULL DEFAULT 'ACTIVE',
                           created_by      UUID            NOT NULL REFERENCES users(id),
                           created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                           updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platforms IS '플랫폼 (스튜디오/센터 단위). 오너만 생성 가능';


-- 플랫폼 ↔ 스태프 N:M (매니저·강사 모두 이 테이블로 관리)
-- 매니저: 플랫폼 1개 고정 (UI 확정), 강사: 복수 플랫폼 가능
CREATE TYPE staff_role AS ENUM ('MANAGER', 'TUTOR');

-- 매니저 권한 등급 — L/M/H 순으로 할 수 있는 일이 늘어난다 (휴가 승인, 스태프 배정/제거, 등급 변경 등).
CREATE TYPE manager_tier AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- 원천징수 계산용 소득 구분 — 강사/매니저/세무사 공통으로 쓰인다.
CREATE TYPE income_type AS ENUM ('EMPLOYMENT', 'BUSINESS', 'OTHER', 'DAILY');

-- 플랫폼별 매니저 그룹 — 이름(일반/관리자/임원 등)과, 그 그룹이 쓸 수 있는 메뉴/기능 권한 목록.
CREATE TABLE manager_groups (
                                id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
                                platform_id   UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                name          VARCHAR(50)   NOT NULL,
                                created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                                UNIQUE (platform_id, name)
);

CREATE TABLE manager_group_permissions (
                                group_id    UUID         NOT NULL REFERENCES manager_groups(id) ON DELETE CASCADE,
                                permission  VARCHAR(40)  NOT NULL,        -- ManagerPermission enum 이름 (MENU_*, FACILITY_MANAGE ...)
                                PRIMARY KEY (group_id, permission)
);

CREATE TABLE platform_staff (
                                id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
                                platform_id     UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                user_id         UUID          NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
                                staff_role      staff_role    NOT NULL,
                                is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
                                joined_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                                left_at         TIMESTAMPTZ,                         -- 퇴사/해제 시각
                                manager_tier    manager_tier,                        -- MANAGER 역할에서만 의미 있음. TUTOR는 NULL
                                manager_group_id UUID         REFERENCES manager_groups(id),       -- MANAGER가 속한 그룹. 이 그룹의 권한이 곧 매니저의 권한 (manager_tier는 예전 값, 미사용)
                                income_type     income_type,                         -- 원천징수용 소득 구분. 배정 시점엔 미정일 수 있음
                                session_rate    INT,                                 -- 강사 회당 강사료. TUTOR 역할에서만 의미 있음
                                UNIQUE (platform_id, user_id, staff_role)
);

COMMENT ON TABLE  platform_staff              IS '플랫폼-스태프 매핑. 한 계정이 한 플랫폼에서 MANAGER+TUTOR을 동시에 가질 수 있음. MANAGER는 1개 플랫폼만 허용 (앱 레이어에서 검증)';
COMMENT ON COLUMN platform_staff.left_at      IS 'NULL이면 재직 중. Soft delete 방식으로 이력 보존';
COMMENT ON COLUMN platform_staff.manager_tier IS 'MANAGER 권한 등급(LOW/MEDIUM/HIGH). 새로 배정된 매니저는 LOW로 시작';
COMMENT ON COLUMN platform_staff.session_rate IS '강사 정산용 회당 강사료 — TUTOR 역할에서만 의미를 가짐';


-- 강사/매니저 초대 — 링크(token)로 들어온 사용자가 이메일/연락처 일치를 확인받고 수락하면 platform_staff로 배정된다.
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');

CREATE TABLE staff_invitations (
                                   id              UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   platform_id     UUID               NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                   staff_role      staff_role         NOT NULL,
                                   manager_tier    manager_tier,                        -- MANAGER 초대에서만 의미 있음
                                   email           VARCHAR(255),                        -- email/phone 중 최소 하나
                                   phone           VARCHAR(30),                         -- 숫자만 저장
                                   token           VARCHAR(64)        NOT NULL UNIQUE,
                                   status          invitation_status  NOT NULL DEFAULT 'PENDING',
                                   expires_at      TIMESTAMPTZ        NOT NULL,
                                   created_by      UUID               NOT NULL REFERENCES users(id),
                                   created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
                                   CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_sinv_platform ON staff_invitations(platform_id, status);

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


-- 플랫폼 ↔ 세무사 — platform_staff와 별개 테이블. 스태프가 아니라 오너가 초대한 읽기 전용
-- 재무 접근 권한이며, 같은 세무사 계정이 여러 오너의 플랫폼에 동시에 걸릴 수 있다.
CREATE TABLE platform_tax_accountants (
                                          id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                          platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                                          user_id         UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
                                          is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                                          joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                          left_at         TIMESTAMPTZ,
                                          income_type     income_type,
                                          UNIQUE (platform_id, user_id)
);

COMMENT ON TABLE platform_tax_accountants IS '오너가 초대한 세무사의 플랫폼별 재무 데이터 접근 권한 (매출 집계, 스태프 정산 계좌 조회)';


-- ============================================================
-- 3. 프로그램 / 슬롯 도메인
-- ============================================================

CREATE TYPE program_type AS ENUM ('GROUP', 'PRIVATE');

-- GROUP에서만 실제로 의미 있는 선택 — 슬롯이 고정 로스터(FIXED)로 채워지는지, 매주 신청(APPLICATION)으로
-- 채워지는지. PRIVATE는 이 값과 무관하게 항상 고정 배정으로 취급한다 (programs.enrollment_mode 참고).
CREATE TYPE enrollment_mode AS ENUM ('FIXED', 'APPLICATION');

CREATE TABLE programs (
                          id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
                          platform_id       UUID              NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                          name              VARCHAR(200)      NOT NULL,  -- 생성 시점 스냅샷. 조회는 pass_id로 join해서 최신 수강권명을 우선한다
                          pass_id           UUID,  -- 이 프로그램을 구매하는 수강권. FK는 passes 테이블 정의 이후 ALTER TABLE로 추가(전방 참조 회피)
                          type              program_type      NOT NULL DEFAULT 'GROUP',
                          enrollment_mode   enrollment_mode   NOT NULL DEFAULT 'FIXED',
                          capacity          SMALLINT          NOT NULL DEFAULT 8 CHECK (capacity >= 1),
                          duration_min      SMALLINT          NOT NULL DEFAULT 60 CHECK (duration_min > 0),
                          description       TEXT,
                          is_active         BOOLEAN           NOT NULL DEFAULT TRUE,
                          created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
                          updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  programs                 IS '수업 유형 카탈로그(그룹/개인). 명칭은 연결된 수강권(pass_id) 이름을 따른다';
COMMENT ON COLUMN programs.enrollment_mode IS 'GROUP일 때만 의미 있음: FIXED(고정 로스터)/APPLICATION(매주 신청). PRIVATE는 항상 고정 배정';


-- 정기 슬롯 (요일·시간 기반 반복 일정)
CREATE TYPE day_of_week AS ENUM ('MON','TUE','WED','THU','FRI','SAT','SUN');

CREATE TABLE slots (
                       id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       program_id      UUID        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
                       name            VARCHAR(200),                                   -- 이 수업 인스턴스 이름 (예: "그룹반A"), 없으면 프로그램명 대체 표시
                       instructor_id   UUID        NOT NULL REFERENCES users(id),     -- TUTOR role
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

ALTER TABLE programs ADD CONSTRAINT fk_programs_pass_id FOREIGN KEY (pass_id) REFERENCES passes(id);


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

COMMENT ON TABLE  discount_policies                IS '할인 정책 정의. 매니저가 플랫폼별로 설정';
COMMENT ON COLUMN discount_policies.condition_value IS 'LONG_TERM: 최소 개월수, FAMILY: 최소 인원수';
COMMENT ON COLUMN discount_policies.rate            IS '할인율(%). 순차 적용 시 각 단계에서 독립 계산';


-- 주문 (장바구니 → 결제 단위)
CREATE TYPE order_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CARD', 'BANK_TRANSFER', 'CASH', 'OTHER');
CREATE TYPE cash_receipt_status AS ENUM ('ISSUED', 'NOT_ISSUED', 'SELF_ISSUED');

CREATE TABLE orders (
                        id                   UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id              UUID                NOT NULL REFERENCES users(id),
                        platform_id          UUID                NOT NULL REFERENCES platforms(id),
                        status               order_status        NOT NULL DEFAULT 'PENDING',
                        original_amount      INT                 NOT NULL DEFAULT 0,  -- 할인 전 합계
                        discount_amount      INT                 NOT NULL DEFAULT 0,  -- 총 할인액
                        final_amount         INT                 NOT NULL DEFAULT 0,  -- 실 결제액
                        paid_at              TIMESTAMPTZ,
                        memo                 TEXT,
                        created_by           UUID                REFERENCES users(id), -- 상담 처리한 스태프 (NULL = 자기 결제)
                        processed_by         UUID                REFERENCES users(id), -- 결제(pay/partial-pay)를 실제로 확정한 사람
                        paid_amount          INT                 NOT NULL DEFAULT 0,  -- 실제 누적 수납액. final_amount 미만이면 PARTIAL
                        payment_method       payment_method,
                        cash_receipt_status  cash_receipt_status NOT NULL DEFAULT 'NOT_ISSUED',
                        receipt_number       VARCHAR(100),        -- 카드 승인번호 / 현금영수증 승인번호
                        refund_amount        INT                 NOT NULL DEFAULT 0,  -- 누적 환불액 (부분 환불 지원)
                        refunded_at          TIMESTAMPTZ,
                        created_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
                        updated_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
                        CONSTRAINT chk_amount CHECK (final_amount >= 0)
);

COMMENT ON TABLE  orders              IS '결제 주문. 여러 수강권을 묶어 한 번에 결제';
COMMENT ON COLUMN orders.created_by   IS '스태프가 상담 후 대신 등록 시 해당 스태프 ID';
COMMENT ON COLUMN orders.processed_by IS '결제를 실제로 처리한 관리자/스태프 (createdBy와 다를 수 있음)';
COMMENT ON COLUMN orders.paid_amount  IS '부분납 지원 — final_amount보다 적으면 상태는 PARTIAL';


-- 주문 항목 (수강권 × 수량)
CREATE TYPE tax_type AS ENUM ('TAXABLE', 'EXEMPT');

CREATE TABLE order_items (
                             id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                             order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                             pass_id         UUID        NOT NULL REFERENCES passes(id),
                             quantity        SMALLINT    NOT NULL DEFAULT 1 CHECK (quantity >= 1),
                             unit_price      INT         NOT NULL,    -- 주문 시점 가격 스냅샷
                             line_total      INT         NOT NULL,    -- quantity × unit_price (할인 전)
                             program_id      UUID,                   -- 수강과목/반 참조용 (FK 아님, Program 재사용)
                             enroll_start    DATE,
                             enroll_end      DATE,
                             tax_type        tax_type    NOT NULL DEFAULT 'EXEMPT'  -- 학원 교습비는 통상 면세
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


-- 고정 로스터 (PRIVATE, 또는 GROUP+FIXED 슬롯 전용) — 등록해두면 매주 신청 없이 Lesson 생성 시
-- reservations가 이 사람 몫으로 자동 생성된다. GROUP+APPLICATION(신청형) 슬롯은 이 테이블을 쓰지 않는다.
-- user_passes를 참조해서 passes/user_passes 섹션 뒤로 옮겨 왔다 (slots 섹션에 있으면 아직 안 만들어진
-- 테이블을 참조하게 돼 실제 DB 적용 시 "relation does not exist"로 실패한다).
CREATE TABLE slot_members (
                               id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                               slot_id         UUID        NOT NULL REFERENCES slots(id),
                               user_id         UUID        NOT NULL REFERENCES users(id),
                               user_pass_id    UUID        NOT NULL REFERENCES user_passes(id),
                               is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                               created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE slot_members IS '개인 또는 고정형 그룹 슬롯의 고정 배정 로스터. 멤버는 이후에도 추가/제외될 수 있음';


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
                                          requested_by    UUID            NOT NULL REFERENCES users(id),  -- 강사(TUTOR)
                                          reservation_id  UUID            NOT NULL REFERENCES reservations(id),
                                          original_date   DATE            NOT NULL,
                                          original_slot   UUID            NOT NULL REFERENCES slots(id),
                                          requested_date  DATE            NOT NULL,
                                          requested_slot  UUID            REFERENCES slots(id),           -- NULL = 슬롯 외 시간
                                          reason          TEXT,
                                          status          request_status  NOT NULL DEFAULT 'PENDING',
                                          decision_memo   TEXT,
                                          decided_by      UUID            REFERENCES users(id),  -- 승인/반려 처리자. PENDING인 동안 NULL
                                          created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                          updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schedule_change_requests IS '강사가 제출한 일정 변경 요청. 매니저 또는 오너가 승인';


-- 스태프의 휴가 요청 — schedule_change_requests와 같은 구조지만 예약에 매이지 않고 날짜 범위만 갖는다.
CREATE TABLE leave_requests (
                                id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                                platform_id     UUID            NOT NULL REFERENCES platforms(id),
                                requested_by    UUID            NOT NULL REFERENCES users(id),
                                start_date      DATE            NOT NULL,
                                end_date        DATE            NOT NULL,
                                reason          TEXT,
                                status          request_status  NOT NULL DEFAULT 'PENDING',
                                decision_memo   TEXT,
                                decided_by      UUID            REFERENCES users(id),
                                created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                CONSTRAINT chk_leave_request_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE leave_requests IS '스태프가 제출한 휴가 요청. 매니저 또는 오너가 승인';


-- 세무사가 등록한 재무 일정(월급날/지출일/명세서 제출일) — 매니저 또는 오너가 승인
CREATE TYPE financial_request_type AS ENUM (
    'PAYDAY',     -- 월급날
    'EXPENSE',    -- 지출일
    'STATEMENT'   -- 명세서 제출
);

CREATE TABLE financial_requests (
                                     id              UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
                                     platform_id     UUID                     NOT NULL REFERENCES platforms(id),
                                     requested_by    UUID                     NOT NULL REFERENCES users(id),  -- 세무사
                                     type            financial_request_type   NOT NULL,
                                     title           VARCHAR(200)             NOT NULL,
                                     event_date      DATE                     NOT NULL,
                                     memo            TEXT,
                                     status          request_status           NOT NULL DEFAULT 'PENDING',
                                     decision_memo   TEXT,
                                     created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
                                     updated_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE financial_requests IS '세무사가 등록한 재무 일정. 매니저 또는 오너가 승인';


-- 재무 요청에 대한 댓글 스레드 — 세무사·매니저·오너가 계속 이어서 남기고, 텍스트 없이 파일만
-- 첨부할 수도 있다 (content, attachment_stored_path 중 최소 하나는 앱 레이어에서 검증).
CREATE TABLE financial_request_comments (
                                             id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
                                             request_id               UUID         NOT NULL REFERENCES financial_requests(id),
                                             author_id                UUID         NOT NULL REFERENCES users(id),
                                             content                  TEXT,
                                             attachment_original_name VARCHAR(255),
                                             attachment_stored_path   VARCHAR(500),
                                             attachment_content_type  VARCHAR(100),
                                             attachment_size_bytes    BIGINT,
                                             created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE financial_request_comments IS '재무 요청에 대한 세무사/매니저/오너 간 댓글 스레드. 파일 첨부는 로컬 디스크에 저장(uploads/), 이 테이블엔 경로만 기록';


-- 처리 이력 (모든 승인/반려 행위 기록 — 담당자 추적)
CREATE TYPE action_target AS ENUM (
    'SCHEDULE_REQUEST',   -- 일정 변경 요청
    'MEMBER_MEMO',        -- 회원 상담 메모
    'STAFF_CHANGE',       -- 강사 등록/변경
    'PASS_REFUND',        -- 수강권 환불
    'PLATFORM_CHANGE',    -- 플랫폼 설정 변경
    'PROGRAM_CHANGE',     -- 프로그램/슬롯 등록·중단
    'PASS_CHANGE',        -- 수강권 등록·중단
    'DISCOUNT_CHANGE',    -- 할인 정책 등록·중단
    'FINANCIAL_REQUEST',  -- 세무사가 등록한 재무 일정 승인/반려
    'FACILITY_CHANGE',    -- 시설물 등록/예약/고장신고/보수처리
    'LEAVE_REQUEST',      -- 휴가 요청 승인/반려
    'JOIN_REQUEST'        -- 회원 가입 신청/승인/반려
);

CREATE TABLE action_logs (
                             id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                             platform_id     UUID            REFERENCES platforms(id),
                             actor_id        UUID            NOT NULL REFERENCES users(id),  -- 처리한 스태프
                             target_type     action_target   NOT NULL,
                             target_id       UUID            NOT NULL,                        -- 대상 레코드 ID
                             action          VARCHAR(50)     NOT NULL,  -- 'APPROVE', 'REJECT', 'CREATE', 'UPDATE', 'COMMENT' 등
                             memo            TEXT,
                             created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  action_logs         IS '모든 처리 이력. 담당자 + 시각 자동 기록. 삭제 불가';
COMMENT ON COLUMN action_logs.actor_id IS '처리한 MANAGER 또는 OWNER';
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
    'HQ_NOTICE',    -- 본사(오너) 공지
    'SHARED',       -- 매니저 간 공유 이벤트
    'CONFLICT'      -- 강사 일정 충돌 (시스템 자동 생성)
);

CREATE TYPE share_scope AS ENUM (
    'PLATFORM',         -- 해당 플랫폼 내
    'ALL_MANAGER',      -- 전체 매니저
    'INCLUDE_OWNER',    -- 오너 포함
    'INCLUDE_TUTOR'     -- 강사 포함
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
COMMENT ON COLUMN calendar_events.type IS 'HQ_NOTICE는 오너만 생성 가능 (앱 레이어 검증)';


-- ============================================================
-- 7-1. 시설물(연습실 등) 도메인
-- ============================================================

-- 오너가 등록하는 예약 가능 시설물 (예: "2층 연습실", "3층 연습실")
CREATE TABLE facilities (
                            id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                            platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
                            name            VARCHAR(200) NOT NULL,
                            description     TEXT,
                            floor           VARCHAR(50),  -- 자유 입력 층 표기 (예: "1층", "지하1층")
                            capacity        INT         NOT NULL DEFAULT 1 CHECK (capacity >= 1),  -- 동시 이용 가능 인원
                            is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
                            pos_x           INT,  -- 배치도 상 위치 (0~100 백분율). NULL이면 아직 배치되지 않음
                            pos_y           INT,
                            open_time       TIME,  -- 예약 가능 시작 시각. 둘 다 NULL이면 시간 제한 없음
                            close_time      TIME,
                            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  facilities         IS '오너가 관리하는 예약 가능 시설물 카탈로그';
COMMENT ON COLUMN facilities.pos_x   IS '배치도 캔버스 상의 x좌표(0~100 백분율), NULL이면 미배치';
COMMENT ON COLUMN facilities.pos_y   IS '배치도 캔버스 상의 y좌표(0~100 백분율), NULL이면 미배치';

CREATE TYPE facility_booking_status AS ENUM ('CONFIRMED', 'CANCELLED');

-- 시설물의 시간대별 예약 — 같은 시설물+날짜에 시간이 겹치는 CONFIRMED 예약은 앱 레이어에서 차단한다.
CREATE TABLE facility_bookings (
                                    id              UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
                                    facility_id     UUID                     NOT NULL REFERENCES facilities(id),
                                    platform_id     UUID                     NOT NULL REFERENCES platforms(id),
                                    user_id         UUID                     NOT NULL REFERENCES users(id),
                                    booking_date    DATE                     NOT NULL,
                                    start_time      TIME                     NOT NULL,
                                    end_time        TIME                     NOT NULL,
                                    purpose         TEXT,
                                    status          facility_booking_status  NOT NULL DEFAULT 'CONFIRMED',
                                    cancelled_at    TIMESTAMPTZ,
                                    created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
                                    CONSTRAINT chk_facility_booking_time CHECK (end_time > start_time)
);

COMMENT ON TABLE facility_bookings IS '시설물 시간대별 예약 (연습실 등)';

CREATE TYPE facility_issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- 시설물 고장/이상 신고 — 누구나 등록, 매니저 이상만 상태 변경(보수 처리)
CREATE TABLE facility_issues (
                                  id                UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
                                  facility_id       UUID                    NOT NULL REFERENCES facilities(id),
                                  platform_id       UUID                    NOT NULL REFERENCES platforms(id),
                                  reported_by       UUID                    NOT NULL REFERENCES users(id),
                                  description       TEXT                    NOT NULL,
                                  status            facility_issue_status   NOT NULL DEFAULT 'OPEN',
                                  resolved_by       UUID                    REFERENCES users(id),
                                  resolved_at       TIMESTAMPTZ,
                                  resolution_memo   TEXT,
                                  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE facility_issues IS '시설물 고장/이상 신고 및 보수 처리 이력';


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

-- leave_requests
CREATE INDEX idx_leavereq_platform     ON leave_requests(platform_id);
CREATE INDEX idx_leavereq_status       ON leave_requests(status);
CREATE INDEX idx_leavereq_requested_by ON leave_requests(requested_by);

-- financial_requests
CREATE INDEX idx_finreq_platform   ON financial_requests(platform_id);
CREATE INDEX idx_finreq_status     ON financial_requests(status);
CREATE INDEX idx_finreq_requested_by ON financial_requests(requested_by);

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

COMMENT ON VIEW vw_platform_monthly_revenue IS '플랫폼별 월간 매출 집계. 오너/매니저 대시보드용';


-- ============================================================
-- 10. 핵심 비즈니스 규칙 체크 함수
-- ============================================================

-- 매니저 한 명이 담당할 수 있는 플랫폼은 1개뿐 (한 플랫폼에 여러 매니저가 있는 것은 허용, INSERT/UPDATE 시 검증)
CREATE OR REPLACE FUNCTION check_manager_single_platform()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.staff_role = 'MANAGER' THEN
        IF EXISTS (
            SELECT 1 FROM platform_staff
            WHERE user_id    = NEW.user_id
              AND staff_role = 'MANAGER'
              AND is_active  = TRUE
              AND id         != NEW.id
        ) THEN
            RAISE EXCEPTION
                '매니저 한 명은 1개 플랫폼만 담당할 수 있습니다. (user_id: %)', NEW.user_id;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_manager_single_platform
    BEFORE INSERT OR UPDATE ON platform_staff
                         FOR EACH ROW EXECUTE FUNCTION check_manager_single_platform();


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
CREATE TRIGGER trg_leavereq_updated_at        BEFORE UPDATE ON leave_requests     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
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
--   schedule_request.created   요청 생성        → 매니저 알림
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
--   calendar_event.shared   공유 일정 생성      → 해당 매니저 전원 알림
--   calendar_event.hq_notice 본사 공지          → 전 플랫폼 알림
--
-- [시스템]
--   slot.conflict_detected  강사 일정 충돌 감지 → 매니저 알림
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