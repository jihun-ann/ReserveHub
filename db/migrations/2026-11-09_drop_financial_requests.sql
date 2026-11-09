-- 업무 요청 배포가 끝나고 옛 서버가 모두 내려간 뒤에 실행한다 (2026-11-09_work_requests.sql 을 한 번 더 돌린 다음).
DROP TABLE IF EXISTS financial_request_comments;
DROP TABLE IF EXISTS financial_requests;
DROP TYPE IF EXISTS financial_request_type;
