-- 테스트 계정 5개 (비밀번호 모두 test). 이미 있는 아이디/이메일은 건너뛴다.
-- pgcrypto의 crypt(..., gen_salt('bf'))는 $2a$ BCrypt 해시를 만들어 Spring BCryptPasswordEncoder와 호환된다.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, email, password_hash, name, phone, role)
SELECT v.username, v.email, crypt('test', gen_salt('bf', 10)), v.name, v.phone, v.role::user_role
FROM (VALUES
    ('owner',   'owner@test.com',   '테스트 오너',   '010-0000-0001', 'OWNER'),
    ('manager', 'manager@test.com', '테스트 매니저', '010-0000-0002', 'MANAGER'),
    ('tutor',   'tutor@test.com',   '테스트 강사',   '010-0000-0003', 'TUTOR'),
    ('user',    'user@test.com',    '테스트 회원',   '010-0000-0004', 'USER'),
    ('tax',     'tax@test.com',     '테스트 세무사', '010-0000-0005', 'TAX_ACCOUNTANT'),
    ('test1',   'test1@test.com',   '테스트1',       '010-1000-0001', 'USER'),
    ('test2',   'test2@test.com',   '테스트2',       '010-1000-0002', 'USER'),
    ('test3',   'test3@test.com',   '테스트3',       '010-1000-0003', 'USER'),
    ('test4',   'test4@test.com',   '테스트4',       '010-1000-0004', 'USER'),
    ('test5',   'test5@test.com',   '테스트5',       '010-1000-0005', 'USER')
) AS v(username, email, name, phone, role)
ON CONFLICT DO NOTHING;
