import { apiGet, apiPost, apiPatch, apiDelete } from "./http.js";

export const BUSINESS_TYPES = [
	{ value: "PILATES", label: "필라테스" },
	{ value: "YOGA", label: "요가" },
	{ value: "MUSIC", label: "음악" },
	{ value: "FITNESS", label: "헬스" },
	{ value: "DANCE", label: "댄스" },
	{ value: "OTHER", label: "기타" }
];

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

export const createPlatform = (payload) => apiPost("/api/v1/platforms", payload);

export const setPlatformSuspended = (id, suspended) => apiPatch(`/api/v1/platforms/${id}/status`, { suspended });

export const listStaff = (platformId, includeInactive = false) =>
	apiGet(`/api/v1/platforms/${platformId}/staff?includeInactive=${includeInactive}`);

export const assignStaff = (platformId, userId, staffRole) =>
	apiPost(`/api/v1/platforms/${platformId}/staff`, { userId, staffRole });

export const removeStaff = (platformId, userId) =>
	apiDelete(`/api/v1/platforms/${platformId}/staff/${userId}`);

export const getUser = (id) => apiGet(`/api/v1/users/${id}`);

export const listPrograms = (platformId) => apiGet(`/api/v1/platforms/${platformId}/programs`);

export const createProgram = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/programs`, payload);

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
			return perStatus.flat().map((r) => ({ ...r, platform }));
		})
	);
	return perPlatform.flat();
}

export const approveScheduleRequest = (id, memo) =>
	apiPost(`/api/v1/schedule-requests/${id}/approve`, memo ? { memo } : undefined);

export const rejectScheduleRequest = (id, memo) =>
	apiPost(`/api/v1/schedule-requests/${id}/reject`, memo ? { memo } : undefined);

export const listMembers = (platformId) => apiGet(`/api/v1/platforms/${platformId}/members`);

export const listMemberMemos = (platformId, userId) =>
	apiGet(`/api/v1/platforms/${platformId}/members/${userId}/memos`);

export const createMemberMemo = (platformId, userId, content) =>
	apiPost(`/api/v1/platforms/${platformId}/members/${userId}/memos`, { content });

export const deleteMemberMemo = (platformId, userId, memoId) =>
	apiDelete(`/api/v1/platforms/${platformId}/members/${userId}/memos/${memoId}`);

export const listPasses = (platformId) => apiGet(`/api/v1/platforms/${platformId}/passes`);

export const createPass = (platformId, payload) => apiPost(`/api/v1/platforms/${platformId}/passes`, payload);

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

export const deactivateDiscountPolicy = (id) => apiDelete(`/api/v1/discount-policies/${id}`);

export const listOrders = (platformId) => apiGet(`/api/v1/platforms/${platformId}/orders`);

export const PROGRAM_TYPE_LABEL = { GROUP: "그룹 레슨", PRIVATE: "개인 레슨", SEMIPRIVATE: "소그룹 레슨" };

export const listLessonHistory = (platformId, from, to) =>
	apiGet(`/api/v1/platforms/${platformId}/lessons?from=${from}&to=${to}`);

export const listMyLessons = (from, to) => apiGet(`/api/v1/lessons/mine?from=${from}&to=${to}`);

export const listLessonAttendance = (lessonId) => apiGet(`/api/v1/lessons/${lessonId}/attendances`);

export const recordAttendance = (lessonId, userId, status) =>
	apiPost(`/api/v1/lessons/${lessonId}/attendances`, { userId, status });

export const startLesson = (lessonId) => apiPost(`/api/v1/lessons/${lessonId}/start`);

export const endLesson = (lessonId) => apiPost(`/api/v1/lessons/${lessonId}/end`);

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

export const refundOrder = (id, memo) => apiPost(`/api/v1/orders/${id}/refund`, memo ? { memo } : undefined);

export const createUserAccount = (email, password, name, phone, role = "USER") =>
	apiPost("/api/v1/users", { email, password, name, phone, role });

// 회원 등록: 계정 생성 -> 수강권 주문 -> 결제 확정까지 이어서 처리한다 (백엔드가 이 세 단계로 나뉘어 있음).
export async function enrollMember(platformId, email, password, name, phone, passId) {
	const user = await createUserAccount(email, password, name, phone);
	const order = await apiPost(`/api/v1/platforms/${platformId}/orders`, {
		buyerUserId: user.id,
		items: [{ passId, quantity: 1 }]
	});
	await apiPost(`/api/v1/orders/${order.id}/pay`);
	return user;
}

// 강사 등록: 계정 생성(TUTOR role) -> 플랫폼 스태프 배정까지 이어서 처리한다.
export async function enrollTutor(platformId, email, password, name, phone) {
	const user = await createUserAccount(email, password, name, phone, "TUTOR");
	await assignStaff(platformId, user.id, "TUTOR");
	return user;
}
