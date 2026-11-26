-- 회원 초대: staff_invitations.staff_role이 NULL이면 회원 초대다(수락하면 승인된 가입 신청 → 센터가 수강권 등록).
ALTER TABLE staff_invitations ALTER COLUMN staff_role DROP NOT NULL;
