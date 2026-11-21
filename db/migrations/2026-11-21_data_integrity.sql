-- 데이터 저장 무결성 보강 (db/schema.sql에도 반영). 여러 번 실행해도 안전하다.
-- CHECK 제약은 NOT VALID로 건다 — 예전 버그로 이미 어긋난 행이 있어도 적용이 실패하지 않고, 새로 쓰는 행부터 검사한다.
-- 기존 행까지 확인하려면 어긋난 행을 정리한 뒤 ALTER TABLE ... VALIDATE CONSTRAINT <이름>; 을 실행한다.

-- 1. 수강권 잔여 횟수: 사용 횟수가 총 횟수를 넘지 않는다 (NULL = 무제한).
DO $$ BEGIN
    ALTER TABLE user_passes ADD CONSTRAINT chk_user_pass_sessions_within_total
        CHECK (sessions_total IS NULL OR sessions_used <= sessions_total) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. 주문 금액: 받은 돈은 결제 총액 이하, 환불은 받은 돈 이하.
DO $$ BEGIN
    ALTER TABLE orders ADD CONSTRAINT chk_order_paid_within_final
        CHECK (paid_amount BETWEEN 0 AND final_amount) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE orders ADD CONSTRAINT chk_order_refund_within_paid
        CHECK (refund_amount BETWEEN 0 AND paid_amount) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. 예약 중복 방지는 살아 있는 예약끼리만 — 취소한 수업을 다시 신청할 수 있게 한다.
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_user_id_slot_id_scheduled_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_active
    ON reservations(user_id, slot_id, scheduled_date) WHERE status <> 'CANCELLED';

-- 4. 매니저 1인 1플랫폼 — 트리거(check_manager_single_platform)는 동시 INSERT 두 건을 모두 통과시킬 수 있어 DB 유니크로도 막는다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_staff_one_active_manager
    ON platform_staff(user_id) WHERE staff_role = 'MANAGER' AND is_active;

-- 5. 처리 이력은 고치거나 지울 수 없다 (테이블 주석의 "삭제 불가"를 실제로 강제).
CREATE OR REPLACE FUNCTION forbid_action_log_change()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'action_logs는 수정/삭제할 수 없습니다.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_action_logs_immutable ON action_logs;
CREATE TRIGGER trg_action_logs_immutable
    BEFORE UPDATE OR DELETE ON action_logs
    FOR EACH ROW EXECUTE FUNCTION forbid_action_log_change();
