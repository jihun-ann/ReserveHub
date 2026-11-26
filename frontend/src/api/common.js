import { createElement } from "react";
import { BookOpen, Building2, Dumbbell, Palette, Scissors } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm, API_BASE_URL, getAccessToken } from "./http.js";

export const BUSINESS_TYPES = [
	{ value: "FITNESS", label: "운동/피트니스" },
	{ value: "ARTS", label: "예체능" },
	{ value: "EDUCATION", label: "교육/학원" },
	{ value: "BEAUTY", label: "뷰티/웰니스" },
	{ value: "OTHER", label: "기타" }
];

const BUSINESS_TYPE_ICON = { FITNESS: Dumbbell, ARTS: Palette, EDUCATION: BookOpen, BEAUTY: Scissors, OTHER: Building2 };

export function businessTypeIcon(value, size = 16) {
	return createElement(BUSINESS_TYPE_ICON[value] || Building2, { size, strokeWidth: 1.5 });
}

export function businessTypeLabel(value) {
	return BUSINESS_TYPES.find((t) => t.value === value)?.label || value;
}

export function hexAlpha(hex, alpha) {
	const c = hex?.replace("#", "");
	if (!c || c.length !== 6) return `rgba(124,106,247,${alpha})`;
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

export const listPlatforms = () => apiGet("/api/v1/platforms");

export const setPlatformSuspended = (id, suspended) => apiPatch(`/api/v1/platforms/${id}/status`, { suspended });

export const listStaff = (platformId, includeInactive = false) =>
	apiGet(`/api/v1/platforms/${platformId}/staff?includeInactive=${includeInactive}`);

export const assignStaff = (platformId, userId, staffRole, managerTier) =>
	apiPost(`/api/v1/platforms/${platformId}/staff`, { userId, staffRole, managerTier });

export const removeStaff = (platformId, userId) =>
	apiDelete(`/api/v1/platforms/${platformId}/staff/${userId}`);

// 매니저 그룹에 줄 수 있는 메뉴/기능 권한 — 백엔드 ManagerPermission과 같은 이름이다.
// kind "menu"는 매니저 사이드바 메뉴(menuId) 노출, "feature"는 해당 기능 실행 권한이다.
export const MANAGER_PERMISSIONS = [
	{ key: "MENU_APPROVAL", label: "결재함 (휴가·일정 변경 조회, 일정 변경 승인)", kind: "feature" },
	{ key: "MENU_MEMBERS", label: "회원 관리", kind: "menu", menuId: "members" },
	{ key: "MENU_TUTOR", label: "강사 관리", kind: "menu", menuId: "tutor" },
	{ key: "MENU_LESSON", label: "수업 관리", kind: "menu", menuId: "lessonManage" },
	{ key: "MENU_FACILITY_STATUS", label: "시설물 현황", kind: "menu", menuId: "facilityStatus" },
	{ key: "MENU_PAYMENT", label: "수강권 / 결제", kind: "menu", menuId: "payment" },
	{ key: "MENU_PAYMENT_HISTORY", label: "결제 이력", kind: "menu", menuId: "paymentHistory" },
	{ key: "MENU_CALC", label: "상담 계산툴", kind: "menu", menuId: "calc" },
	{ key: "MENU_HISTORY", label: "수업 이력", kind: "menu", menuId: "history" },
	{ key: "MENU_ACTIVITY_LOG", label: "활동 이력", kind: "menu", menuId: "activityLog" },
	{ key: "FACILITY_MANAGE", label: "시설 예약 취소 / 시설 이슈 처리", kind: "feature" },
	{ key: "PROGRAM_MANAGE", label: "프로그램 운영", kind: "feature" },
	{ key: "TUTOR_MANAGE", label: "강사 초대 / 삭제", kind: "feature" },
	{ key: "MANAGER_MANAGE", label: "매니저 초대 / 삭제, 그룹 관리", kind: "feature", menuId: "managerManage" },
	{ key: "LEAVE_APPROVE", label: "휴가요청 승인 / 반려", kind: "feature" },
	{ key: "DISCOUNT_POLICY", label: "할인정책 관리", kind: "feature" },
	{ key: "REFUND", label: "환불", kind: "feature" },
	{ key: "JOIN_REQUEST_MANAGE", label: "가입 신청 처리", kind: "feature" }
];

// 현재 로그인한 사용자가 이 플랫폼에서 가진 매니저 권한 목록(오너는 전부). 백엔드가 실제 권한을 다시
// 검증하므로(PlatformAccessGuard.verifyManagerPermission), 이건 메뉴/버튼 노출을 위한 UX 용도일 뿐 보안 경계가 아니다.
export const getMyPermissions = (platformId) => apiGet(`/api/v1/platforms/${platformId}/my-permissions`);

// 플랫폼별 매니저 그룹 — 이름 + 권한 목록(permissions). 매니저는 그룹에 속하고, 그룹의 권한을 갖는다.
export const listManagerGroups = (platformId) => apiGet(`/api/v1/platforms/${platformId}/manager-groups`);
export const createManagerGroup = (platformId, name, permissions) =>
	apiPost(`/api/v1/platforms/${platformId}/manager-groups`, { name, permissions });
export const updateManagerGroup = (groupId, name, permissions) =>
	apiPatch(`/api/v1/manager-groups/${groupId}`, { name, permissions });
export const deleteManagerGroup = (groupId) => apiDelete(`/api/v1/manager-groups/${groupId}`);
export const assignManagerGroup = (platformId, userId, groupId) =>
	apiPatch(`/api/v1/platforms/${platformId}/staff/${userId}/manager-group`, { groupId });

// 회원 가입 신청 — 회원이 플랫폼을 이름/ID로 찾아 신청하고, 센터가 승인/반려한 뒤 수강권을 등록한다.
export const searchPlatforms = (q) => apiGet(`/api/v1/platforms/search?q=${encodeURIComponent(q)}`);
export const applyJoinRequest = (platformId, message) => apiPost(`/api/v1/platforms/${platformId}/join-requests`, { message });
export const listMyJoinRequests = () => apiGet("/api/v1/join-requests/mine");
export const cancelJoinRequest = (id) => apiPost(`/api/v1/join-requests/${id}/cancel`, {});
export const listJoinRequests = (platformId) => apiGet(`/api/v1/platforms/${platformId}/join-requests`);
export const approveJoinRequest = (id, memo) => apiPost(`/api/v1/join-requests/${id}/approve`, { memo });
export const rejectJoinRequest = (id, memo) => apiPost(`/api/v1/join-requests/${id}/reject`, { memo });

// 내 정보 — 생년월일/보호자, 이메일·연락처 인증, 계정 탈퇴(비활성화).
export const updateMyDetails = (payload) => apiPatch("/api/v1/users/me/details", payload);
export const requestContactVerification = (channel) => apiPost(`/api/v1/users/me/verifications/${channel}/request`, {});
export const confirmContactVerification = (channel, code) => apiPost(`/api/v1/users/me/verifications/${channel}/confirm`, { code });
export const deactivateMyAccount = (password) => apiPost("/api/v1/users/me/deactivate", { password });

// 세무사 — 스태프가 아니라 오너가 초대한 별도의 재무 데이터 접근 권한.
export const listTaxAccountants = (platformId) => apiGet(`/api/v1/platforms/${platformId}/tax-accountants`);

export const grantTaxAccountant = (platformId, payload) =>
	apiPost(`/api/v1/platforms/${platformId}/tax-accountants`, payload);

export const revokeTaxAccountant = (platformId, userId) =>
	apiDelete(`/api/v1/platforms/${platformId}/tax-accountants/${userId}`);

export const listStaffPayroll = (platformId, year, month) =>
	apiGet(`/api/v1/platforms/${platformId}/staff-payroll${year && month ? `?year=${year}&month=${month}` : ""}`);

export const INCOME_TYPE_LABEL = { EMPLOYMENT: "근로소득자", BUSINESS: "사업소득자", OTHER: "기타소득자", DAILY: "일용근로자" };

export const updateStaffIncomeType = (platformId, userId, incomeType) =>
	apiPatch(`/api/v1/platforms/${platformId}/staff/${userId}/income-type`, { incomeType });

export const updateStaffSessionRate = (platformId, userId, sessionRate) =>
	apiPatch(`/api/v1/platforms/${platformId}/staff/${userId}/session-rate`, { sessionRate });

export const updateTaxAccountantIncomeType = (platformId, userId, incomeType) =>
	apiPatch(`/api/v1/platforms/${platformId}/tax-accountants/${userId}/income-type`, { incomeType });

export const WORK_REQUEST_STATUS_LABEL = {
	REQUESTED: "요청됨", IN_PROGRESS: "진행 중", DONE: "완료", CANCELED: "취소", REVISION_REQUESTED: "추가 확인 요청"
};
export const WORK_REQUEST_OPEN = ["REQUESTED", "IN_PROGRESS", "REVISION_REQUESTED"];

// 목록에 보일 상태 — 담당자가 열어 봤지만 아직 시작 전이면 "확인함".
export const workRequestStatusLabel = (r) =>
	r.status === "REQUESTED" && r.readAt ? "확인함" : WORK_REQUEST_STATUS_LABEL[r.status];

// 담당자 할 일 순서 — 긴급(등록 순) → 내가 정한 순서 → 등록 순.
export const byWorkPriority = (a, b) =>
	(b.urgent - a.urgent) ||
	(a.urgent ? (a.createdAt < b.createdAt ? -1 : 1) : 0) ||
	((a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)) ||
	(a.createdAt < b.createdAt ? -1 : 1);

export const createWorkRequest = (platformId, { assigneeId, title, memo, dueDate, urgent }) =>
	apiPost(`/api/v1/platforms/${platformId}/work-requests`, { assigneeId, title, memo: memo || null, dueDate: dueDate || null, urgent: !!urgent });

export const markWorkRequestRead = (id) => apiPost(`/api/v1/work-requests/${id}/read`);

export const markWorkRequestUrgent = (id) => apiPost(`/api/v1/work-requests/${id}/urgent`);

export const reorderWorkRequests = (platformId, ids) =>
	apiPost(`/api/v1/platforms/${platformId}/work-requests/order`, { ids });

// 내가 직접 추가한 할 일만 지워진다.
export const deleteWorkRequestTodo = (id) => apiDelete(`/api/v1/work-requests/${id}`);

export const listWorkRequests = (platformId) =>
	apiGet(`/api/v1/platforms/${platformId}/work-requests`);

export const listWorkRequestAssignees = (platformId) =>
	apiGet(`/api/v1/platforms/${platformId}/work-requests/assignees`);

export const changeWorkRequestStatus = (id, status) =>
	apiPost(`/api/v1/work-requests/${id}/status`, { status });

export const listWorkRequestComments = (requestId) =>
	apiGet(`/api/v1/work-requests/${requestId}/comments`);

export const addWorkRequestComment = (requestId, { content, file } = {}) => {
	const formData = new FormData();
	if (content?.trim()) formData.append("content", content);
	if (file) formData.append("file", file);
	return apiPostForm(`/api/v1/work-requests/${requestId}/comments`, formData);
};

export const openWorkRequestAttachment = (requestId, commentId) =>
	openProtectedFile(`/api/v1/work-requests/${requestId}/comments/${commentId}/attachment`);

// 플랫폼 개설 신청 — 사업자등록증 파일과 함께 보낸다. 운영자(ADMIN)가 승인하면 플랫폼이 만들어지고 신청자가 오너가 된다.
export const submitPlatformApplication = (fields, certificate) => {
	const formData = new FormData();
	Object.entries(fields).forEach(([key, value]) => {
		if (value != null && String(value).trim() !== "") formData.append(key, value);
	});
	formData.append("certificate", certificate);
	return apiPostForm("/api/v1/platform-applications", formData);
};
export const listMyPlatformApplications = () => apiGet("/api/v1/platform-applications/mine");
export const cancelPlatformApplication = (id) => apiPost(`/api/v1/platform-applications/${id}/cancel`, {});
export const openPlatformCertificate = (id) => openProtectedFile(`/api/v1/platform-applications/${id}/certificate`);

// 운영자 전용 — 개설 신청 심사
export const listPlatformApplicationsForAdmin = (status) => apiGet(`/api/v1/admin/platform-applications?status=${status}`);
export const approvePlatformApplication = (id, memo) => apiPost(`/api/v1/admin/platform-applications/${id}/approve`, { memo });
export const rejectPlatformApplication = (id, memo) => apiPost(`/api/v1/admin/platform-applications/${id}/reject`, { memo });

export const APPLICATION_STATUS = {
	PENDING: { label: "심사 중", color: "var(--text-sub)" },
	APPROVED: { label: "승인됨", color: "var(--green)" },
	REJECTED: { label: "반려됨", color: "var(--red)" },
	CANCELLED: { label: "취소됨", color: "var(--text-dim)" }
};

// 123-45-67890 형태로 보여준다 (서버에는 숫자 10자리로 저장된다).
export const formatBusinessNumber = (n) => (n?.length === 10 ? `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}` : n);

// 인증이 Bearer 토큰이라 <a href>로 그냥 열 수 없다 — Authorization 헤더를 실어 fetch한 뒤
// blob URL로 새 탭에 연다.
async function openProtectedFile(path) {
	const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
	if (!response.ok) throw new Error(`Request failed: ${response.status}`);
	// blob URL은 앱과 같은 오리진이라, html/svg 같은 타입을 새 탭에 열면 첨부 속 스크립트가 로그인 토큰에 닿는다.
	// 안전한 타입만 새 탭에 열고, 나머지는 파일로 내려받게 한다 (서버도 같은 허용 목록으로 타입을 거른다).
	const blob = await response.blob();
	const blobUrl = URL.createObjectURL(blob);
	if (INLINE_SAFE_TYPES.includes(blob.type)) {
		window.open(blobUrl, "_blank", "noopener");
	} else {
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = attachmentFilename(response) || "attachment";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

const INLINE_SAFE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"];

// Content-Disposition: attachment; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C.hwp
function attachmentFilename(response) {
	const header = response.headers.get("Content-Disposition") || "";
	const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
	if (encoded) return decodeURIComponent(encoded[1]);
	const plain = /filename="?([^";]+)"?/i.exec(header);
	return plain ? plain[1] : null;
}

export const listActionLogs = (platformId) => apiGet(`/api/v1/platforms/${platformId}/action-logs`);

// 활동 이력 화면에서 항목(targetType)과 작업(action) 코드를 한글로 보여주기 위한 이름표.
export const ACTION_TARGET_LABEL = {
	SCHEDULE_REQUEST: "일정 변경 요청",
	MEMBER_MEMO: "회원 메모",
	STAFF_CHANGE: "스태프 변경",
	PASS_REFUND: "수강권 환불",
	PLATFORM_CHANGE: "플랫폼 상태",
	PROGRAM_CHANGE: "프로그램 변경",
	PASS_CHANGE: "수강권 변경",
	DISCOUNT_CHANGE: "할인 정책 변경",
	FINANCIAL_REQUEST: "업무 요청",
	FACILITY_CHANGE: "시설 변경",
	LEAVE_REQUEST: "휴가 요청",
	JOIN_REQUEST: "가입 신청"
};

export const ACTION_LABEL = {
	CREATE: "등록", UPDATE: "수정", DEACTIVATE: "비활성화", APPROVE: "승인", REJECT: "반려", COMMENT: "댓글",
	BOOK: "예약", REPORT_ISSUE: "고장 신고", IN_PROGRESS: "처리 시작", RESOLVE: "해결",
	ADD_SLOT: "슬롯 추가", DEACTIVATE_SLOT: "슬롯 비활성화", ADD_SLOT_MEMBER: "명단 추가", REMOVE_SLOT_MEMBER: "명단 제외",
	REFUND: "환불", SUSPEND: "운영 정지", ACTIVATE: "정지 해제",
	ASSIGN_TUTOR: "강사 배정", ASSIGN_MANAGER: "매니저 배정", REMOVE: "직원 삭제",
	INVITE_TUTOR: "강사 초대", INVITE_MANAGER: "매니저 초대", INVITE_CANCEL: "초대 취소", INVITE_ACCEPT: "초대 수락",
	UPDATE_INCOME_TYPE: "소득유형 변경", UPDATE_SESSION_RATE: "강사료 변경",
	JOIN_APPLY: "가입 신청", JOIN_CANCEL: "신청 취소", JOIN_APPROVE: "가입 승인", JOIN_REJECT: "가입 반려",
	CREATE_MANAGER_GROUP: "그룹 생성", UPDATE_MANAGER_GROUP: "그룹 수정", DELETE_MANAGER_GROUP: "그룹 삭제", CHANGE_MANAGER_GROUP: "그룹 변경"
};

export const getUser = (id) => apiGet(`/api/v1/users/${id}`);

export const listPrograms = (platformId) => apiGet(`/api/v1/platforms/${platformId}/programs`);

export const createProgram = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/programs`, payload);

export const updateProgram = (id, payload) => apiPatch(`/api/v1/programs/${id}`, payload);

export const DAY_OF_WEEK_LABEL = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };

export const addProgramSlot = (programId, payload) => apiPost(`/api/v1/programs/${programId}/slots`, payload);

export const listProgramSlots = (programId) => apiGet(`/api/v1/programs/${programId}/slots`);

export const deactivateProgramSlot = (programId, slotId) => apiDelete(`/api/v1/programs/${programId}/slots/${slotId}`);

export const addSlotMember = (programId, slotId, payload) =>
	apiPost(`/api/v1/programs/${programId}/slots/${slotId}/members`, payload);

export const listSlotMembers = (programId, slotId) => apiGet(`/api/v1/programs/${programId}/slots/${slotId}/members`);

export const removeSlotMember = (programId, slotId, memberId) =>
	apiDelete(`/api/v1/programs/${programId}/slots/${slotId}/members/${memberId}`);

const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

// Schedule-change requests are scoped per platform on the backend; fetch every status for
// every owner platform and merge client-side so the UI can filter without extra round-trips.
export async function listAllScheduleRequests(platforms) {
	const perPlatform = await Promise.all(
		platforms.map(async (platform) => {
			const perStatus = await Promise.all(
				REQUEST_STATUSES.map((status) =>
					apiGet(`/api/v1/platforms/${platform.id}/schedule-requests?status=${status}`)
				)
			);
			return perStatus.flat().map((r) => ({ ...r, platform, requestType: "SCHEDULE_CHANGE" }));
		})
	);
	return perPlatform.flat();
}

export const approveScheduleRequest = (id, memo) =>
	apiPost(`/api/v1/schedule-requests/${id}/approve`, memo ? { memo } : undefined);

export const rejectScheduleRequest = (id, memo) =>
	apiPost(`/api/v1/schedule-requests/${id}/reject`, memo ? { memo } : undefined);

export const createLeaveRequest = (platformId, payload) =>
	apiPost(`/api/v1/platforms/${platformId}/leave-requests`, payload);

export const listMyLeaveRequests = () => apiGet("/api/v1/leave-requests/me");

// 승인 관리 화면에 일정 변경 요청과 함께 합쳐서 보여주기 위해 동일한 방식으로 전체 플랫폼/상태를 모은다.
export async function listAllLeaveRequests(platforms) {
	const perPlatform = await Promise.all(
		platforms.map(async (platform) => {
			const perStatus = await Promise.all(
				REQUEST_STATUSES.map((status) =>
					apiGet(`/api/v1/platforms/${platform.id}/leave-requests?status=${status}`)
				)
			);
			return perStatus.flat().map((r) => ({ ...r, platform, requestType: "LEAVE" }));
		})
	);
	return perPlatform.flat();
}

export const approveLeaveRequest = (id, memo) =>
	apiPost(`/api/v1/leave-requests/${id}/approve`, memo ? { memo } : undefined);

export const rejectLeaveRequest = (id, memo) =>
	apiPost(`/api/v1/leave-requests/${id}/reject`, memo ? { memo } : undefined);

export const listMembers = (platformId) => apiGet(`/api/v1/platforms/${platformId}/members`);

export const updateMemberGuardian = (platformId, userId, guardianName, guardianPhone) =>
	apiPatch(`/api/v1/platforms/${platformId}/members/${userId}/guardian`, { guardianName, guardianPhone });

export const listMemberMemos = (platformId, userId) =>
	apiGet(`/api/v1/platforms/${platformId}/members/${userId}/memos`);

export const createMemberMemo = (platformId, userId, content) =>
	apiPost(`/api/v1/platforms/${platformId}/members/${userId}/memos`, { content });

export const deleteMemberMemo = (platformId, userId, memoId) =>
	apiDelete(`/api/v1/platforms/${platformId}/members/${userId}/memos/${memoId}`);

export const listPasses = (platformId) => apiGet(`/api/v1/platforms/${platformId}/passes`);

export const createPass = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/passes`, payload);

export const updatePass = (id, payload) => apiPatch(`/api/v1/passes/${id}`, payload);

export const deactivatePass = (id) => apiDelete(`/api/v1/passes/${id}`);

export const DISCOUNT_TYPES = [
	{ value: "LONG_TERM", label: "장기 등록" },
	{ value: "FAMILY", label: "가족/지인 등록" },
	{ value: "PROMOTION", label: "프로모션" },
	{ value: "COUPON", label: "쿠폰" },
	{ value: "MANUAL", label: "수동 적용" }
];

export const listDiscountPolicies = (platformId) => apiGet(`/api/v1/platforms/${platformId}/discount-policies`);

export const createDiscountPolicy = (platformId, payload) =>
	apiPost(`/api/v1/platforms/${platformId}/discount-policies`, payload);

export const updateDiscountPolicy = (id, payload) => apiPatch(`/api/v1/discount-policies/${id}`, payload);

export const deactivateDiscountPolicy = (id) => apiDelete(`/api/v1/discount-policies/${id}`);

export const listOrders = (platformId) => apiGet(`/api/v1/platforms/${platformId}/orders`);

export const ORDER_STATUS_LABEL = { PENDING: "미납", PARTIAL: "부분납", PAID: "결제완료", CANCELLED: "취소", REFUNDED: "환불" };

export const PAYMENT_METHOD_LABEL = { CARD: "카드", BANK_TRANSFER: "계좌이체", CASH: "현금", OTHER: "기타" };

export const CASH_RECEIPT_STATUS_LABEL = { ISSUED: "발급", NOT_ISSUED: "미발급", SELF_ISSUED: "자진발급" };

export const TAX_TYPE_LABEL = { TAXABLE: "과세", EXEMPT: "면세" };

export const createOrder = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/orders`, payload);

export const payOrder = (id, payload) => apiPost(`/api/v1/orders/${id}/pay`, payload);

export const partialPayOrder = (id, payload) => apiPost(`/api/v1/orders/${id}/partial-pay`, payload);

// 기존 회원에게 새 결제(재등록/월별 반복 결제 등)를 등록하고 바로 결제 확정까지 처리한다.
export async function registerMemberPayment(platformId, buyerUserId, item, payment) {
	const order = await createOrder(platformId, { buyerUserId, items: [{ ...item, quantity: 1 }] });
	return payOrder(order.id, payment);
}

export const getRevenueRecords = (platformId, year, month, includeTax = true) =>
	apiGet(`/api/v1/platforms/${platformId}/revenue/records?year=${year}&month=${month}&includeTax=${includeTax}`);

export const getRevenueSummary = (platformId, year, month, includeTax = true) =>
	apiGet(`/api/v1/platforms/${platformId}/revenue/summary?year=${year}&month=${month}&includeTax=${includeTax}`);

export const PROGRAM_TYPE_LABEL = { GROUP: "그룹반", PRIVATE: "개인수업" };
export const ENROLLMENT_MODE_LABEL = { FIXED: "고정형", APPLICATION: "신청형" };

export const listLessonHistory = (platformId, from, to) =>
	apiGet(`/api/v1/platforms/${platformId}/lessons?from=${from}&to=${to}`);

export const listMyLessons = (from, to) => apiGet(`/api/v1/lessons/mine?from=${from}&to=${to}`);

export const listLessonAttendance = (lessonId) => apiGet(`/api/v1/lessons/${lessonId}/attendances`);

export const recordAttendance = (lessonId, userId, status) =>
	apiPost(`/api/v1/lessons/${lessonId}/attendances`, { userId, status });

// 수업 회차(Lesson) 기록을 만든다 — 강사가 오늘 수업을 시작할 때 처음 한 번. 고정 로스터면 서버가 예약도 함께 만든다.
export const createLesson = (slotId, lessonDate) => apiPost(`/api/v1/slots/${slotId}/lessons`, { lessonDate });
export const startLesson = (lessonId) => apiPost(`/api/v1/lessons/${lessonId}/start`);

export const endLesson = (lessonId) => apiPost(`/api/v1/lessons/${lessonId}/end`);

export const FACILITY_ISSUE_STATUS_LABEL = { OPEN: "접수됨", IN_PROGRESS: "보수 중", RESOLVED: "보수 완료" };

export const createFacility = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/facilities`, payload);

export const listFacilities = (platformId) => apiGet(`/api/v1/platforms/${platformId}/facilities`);

export const updateFacility = (id, payload) => apiPatch(`/api/v1/facilities/${id}`, payload);

export const updateFacilityPosition = (id, posX, posY) => apiPatch(`/api/v1/facilities/${id}/position`, { posX, posY });

export const deactivateFacility = (id) => apiDelete(`/api/v1/facilities/${id}`);

// 예약 전 현황 확인 — 예약자 신원 없이 시간대만 반환한다.
export const listFacilityBookingSlots = (facilityId, date) =>
	apiGet(`/api/v1/facilities/${facilityId}/bookings?date=${date}`);

export const bookFacility = (facilityId, payload) => apiPost(`/api/v1/facilities/${facilityId}/bookings`, payload);

export const listFacilityBookingsForPlatform = (platformId, date) =>
	apiGet(`/api/v1/platforms/${platformId}/facility-bookings?date=${date}`);

export const listMyFacilityBookings = () => apiGet("/api/v1/facility-bookings/mine");

export const cancelFacilityBooking = (id) => apiPost(`/api/v1/facility-bookings/${id}/cancel`);

export const reportFacilityIssue = (facilityId, description) =>
	apiPost(`/api/v1/facilities/${facilityId}/issues`, { description });

export const listFacilityIssues = (platformId) => apiGet(`/api/v1/platforms/${platformId}/facility-issues`);

export const markFacilityIssueInProgress = (id) => apiPost(`/api/v1/facility-issues/${id}/in-progress`);

export const resolveFacilityIssue = (id, resolutionMemo) =>
	apiPost(`/api/v1/facility-issues/${id}/resolve`, resolutionMemo ? { resolutionMemo } : undefined);

export const listMyScheduleRequests = () => apiGet("/api/v1/schedule-requests/me");

export const listMySlots = () => apiGet("/api/v1/slots/mine");

export const listReservationsForSlot = (slotId, date) =>
	apiGet(`/api/v1/slots/${slotId}/reservations?date=${date}`);

export const createScheduleChangeRequest = (platformId, payload) =>
	apiPost(`/api/v1/platforms/${platformId}/schedule-requests`, payload);

export const EVENT_TYPE_STYLE = {
	SHARED: { label: "공유 이벤트", color: "#7c6af7" },
	NOTICE: { label: "플랫폼 공지", color: "#f6ad55" },
	HQ_NOTICE: { label: "본사 공지", color: "#f87171" },
	HOLIDAY: { label: "휴무", color: "#4fd1c5" },
	CONFLICT: { label: "일정 충돌", color: "#f87171" }
};

export const listCalendarEvents = (platformId, from, to) =>
	apiGet(`/api/v1/platforms/${platformId}/calendar-events?from=${from}&to=${to}`);

// calendar-events는 플랫폼 단위로만 조회되므로, 여러 플랫폼에 소속된 강사를 위해 합쳐서 반환한다.
export async function listCalendarEventsForPlatforms(platforms, from, to) {
	const perPlatform = await Promise.all(platforms.map((p) => listCalendarEvents(p.id, from, to)));
	return perPlatform.flat();
}

export const createCalendarEvent = (payload) => apiPost("/api/v1/calendar-events", payload);

export const refundOrder = (id, memo, amount) =>
	apiPost(`/api/v1/orders/${id}/refund`, memo || amount ? { memo, amount } : undefined);

// 강사/매니저/회원(staffRole: null) 초대 — 링크(token)를 발급하고, 초대받은 사람이 로그인 후 이메일/연락처 일치를 확인받아 수락한다.
export const createStaffInvitation = (platformId, payload) =>
	apiPost(`/api/v1/platforms/${platformId}/staff-invitations`, payload);

export const listStaffInvitations = (platformId) =>
	apiGet(`/api/v1/platforms/${platformId}/staff-invitations`);

export const cancelStaffInvitation = (id) => apiPost(`/api/v1/staff-invitations/${id}/cancel`, {});

export const previewStaffInvitation = (token) => apiGet(`/api/v1/staff-invitations/token/${token}`);

export const acceptStaffInvitation = (token) => apiPost(`/api/v1/staff-invitations/token/${token}/accept`, {});

// 휴가 한 건의 표시 — 시간 단위면 "날짜 (2시간)", 하루 연차면 "날짜 (연차)", 여러 날이면 "시작 ~ 끝".
export const leavePeriodLabel = (r) =>
	r.hours ? `${r.startDate} (${r.hours}시간)` : r.startDate === r.endDate ? `${r.startDate} (연차)` : `${r.startDate} ~ ${r.endDate}`;
