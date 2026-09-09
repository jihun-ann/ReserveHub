import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { closeSidebar, toggleCollapse, openSidebar } from "./default.js";
import { getTheme, toggleTheme } from "../theme.js";
import "./manager/ManagerView.css";
import "./tutor/TutorView.css";
import "./owner/OwnerView.css";
import "./user/UserView.css";
import "./taxaccountant/TaxAccountantView.css";
import { getCurrentUser, loadCurrentUser, clearSession, displayName } from "../api/http.js";
import { listPlatforms, listAllScheduleRequests, listAllLeaveRequests } from "../api/common.js";

import ManagerDashBoardView from "./manager/ManagerDashBoardView.jsx";
import ManagerApprovalView from "./manager/ManagerApprovalView.jsx";
import ManagerMemberManageView from "./manager/ManagerMemberManageView.jsx";
import ManagerTutorManageView from "./manager/ManagerTutorManageView.jsx";
import ManagerPaymentView from "./manager/ManagerPaymentView.jsx";
import ManagerPaymentHistoryView from "./manager/ManagerPaymentHistoryView.jsx";
import ManagerLessonManageView from "./manager/ManagerLessonManageView.jsx";
import ManagerCalculationView from "./manager/ManagerCalculationView.jsx";
import ManagerCalendarView from "./manager/ManagerCalendarView.jsx";
import ManagerStudyHistoryView from "./manager/ManagerStudyHistoryView.jsx";
import ManagerMypageView from "./manager/ManagerMypageView.jsx";

import TutorCalendarView from "./tutor/TutorCalendarView.jsx";
import TutorAttendanceView from "./tutor/TutorAttendanceView.jsx";
import TutorAttendanceHistoryView from "./tutor/TutorAttendanceHistoryView.jsx";
import TutorScheduleRequestView from "./tutor/TutorScheduleRequestView.jsx";
import TutorMypageView from "./tutor/TutorMypageView.jsx";

import OwnerDashboardView from "./owner/OwnerDashboardView.jsx";
import OwnerApprovalView from "./owner/OwnerApprovalView.jsx";
import OwnerPlatformView from "./owner/OwnerPlatformView.jsx";
import OwnerMypageView from "./owner/OwnerMypageView.jsx";

import UserCalendarView from "./user/UserCalendarView.jsx";
import UserReservationView from "./user/UserReservationView.jsx";
import UserMypageView from "./user/UserMypageView.jsx";

import TaxAccountantRevenueView from "./taxaccountant/TaxAccountantRevenueView.jsx";
import TaxAccountantStaffView from "./taxaccountant/TaxAccountantStaffView.jsx";
import TaxAccountantCalendarView from "./taxaccountant/TaxAccountantCalendarView.jsx";
import TaxAccountantMypageView from "./taxaccountant/TaxAccountantMypageView.jsx";

import ManagerActivityLogView from "./manager/ManagerActivityLogView.jsx";
import ManagerFacilityView from "./manager/ManagerFacilityView.jsx";
import OwnerFacilityView from "./owner/OwnerFacilityView.jsx";
import UserFacilityBookingView from "./user/UserFacilityBookingView.jsx";
import TutorFacilityReportView from "./tutor/TutorFacilityReportView.jsx";

// 우선순위: 플랫폼 진입 시 기본으로 강조할 역할 하나를 고르는 순서(스태프 성격이 강한 순)이자,
// 메뉴 섹션을 나열하는 순서이기도 하다.
const ROLE_PRIORITY = ["OWNER", "MANAGER", "TUTOR", "USER", "TAX_ACCOUNTANT"];

// 각 역할의 기존 화면 전체(레이아웃 포함)가 이미 #owner-app/#manager-app/#tutor-app/#user-app/
// #taxaccountant-app로 스코프된 CSS를 갖고 있어서, 셸 루트의 id만 바꾸면 색상 테마가 그대로 따라온다.
const SHELL_ID = {
	OWNER: "owner-app",
	MANAGER: "manager-app",
	TUTOR: "tutor-app",
	USER: "user-app",
	TAX_ACCOUNTANT: "taxaccountant-app"
};
const ROLE_LABEL = { OWNER: "대표", MANAGER: "매니저", TUTOR: "강사", USER: "수강생", TAX_ACCOUNTANT: "세무사" };
// 사이드바의 4단계 플랫폼 전환 영역 전용 라벨 — 본문/역할표시(ROLE_LABEL)와는 별개로,
// 이 스위처에서는 요청받은 명칭(오너/관리자/튜터/사용자)을 그대로 쓴다.
const TIER_LABEL = { OWNER: "오너", MANAGER: "관리자", TUTOR: "튜터", USER: "사용자", TAX_ACCOUNTANT: "세무사" };
const DEFAULT_CONTEXT = {
	OWNER: "dashboard",
	MANAGER: "dashboard",
	TUTOR: "calendar",
	USER: "calendar",
	TAX_ACCOUNTANT: "revenue"
};

const COMMON_MENU = [
	{ id: "calendar", label: "캘린더", icon: "📅" },
	{ id: "mypage", label: "내 정보", icon: "👤" }
];
// 강사/매니저는 업무가 겹쳐 역할 섹션이 같이 뜨는 경우가 많다 — 캘린더/내 정보를 섹션마다
// 중복 노출하는 대신 사이드바 맨 아래에 공유 메뉴 하나로 뺀다.
const SHARED_BOTTOM_ROLES = ["TUTOR", "MANAGER"];
// 세무사는 본인 레슨/예약이 없는 외부 조회 역할이라 캘린더가 의미 없다 — UserCalendarView는
// #user-app 전용 CSS라 다른 셸에서 그냥 깨져 보이기도 해서, 아예 메뉴에서 뺀다.
const NO_CALENDAR_ROLES = ["TAX_ACCOUNTANT"];
const ROLE_MENU = {
	OWNER: [
		{ id: "dashboard", label: "대시보드", icon: "📊" },
		{ id: "platform", label: "플랫폼 관리", icon: "🏢" },
		{ id: "facility", label: "시설물 관리", icon: "🏗" },
		{ id: "facilityStatus", label: "시설물 현황", icon: "🧾" },
		{ id: "approval", label: "승인 관리", icon: "✅" }
	],
	MANAGER: [
		{ id: "dashboard", label: "대시보드", icon: "📊" },
		{ id: "approval", label: "승인 관리", icon: "✅" },
		{ id: "members", label: "회원 관리", icon: "👥" },
		{ id: "tutor", label: "강사 관리", icon: "🧑‍🏫" },
		{ id: "lessonManage", label: "수업 관리", icon: "📌" },
		{ id: "facilityStatus", label: "시설물 현황", icon: "🏗" },
		{ id: "payment", label: "수강권 / 결제", icon: "💳" },
		{ id: "paymentHistory", label: "결제 이력", icon: "🧾" },
		{ id: "calc", label: "상담 계산툴", icon: "🧮" },
		{ id: "history", label: "수업 이력", icon: "📋" },
		{ id: "activityLog", label: "활동 이력", icon: "🕒" }
	],
	TUTOR: [
		{ id: "attendance", label: "출석 관리", icon: "✅" },
		{ id: "attendHistory", label: "출석 이력", icon: "📋" },
		{ id: "schedule", label: "일정 변경 요청", icon: "📋" },
		{ id: "facilityReport", label: "시설물 고장 신고", icon: "🏗" }
	],
	USER: [
		{ id: "reservation", label: "수업 예약", icon: "🎯" },
		{ id: "facility", label: "시설물 예약", icon: "🏗" }
	],
	TAX_ACCOUNTANT: [
		{ id: "revenue", label: "매출 집계", icon: "💰" },
		{ id: "payroll", label: "직원 정보", icon: "🧾" },
		{ id: "finCalendar", label: "재무 일정", icon: "🗓" }
	]
};

function pickActiveRole(roles) {
	return ROLE_PRIORITY.find((r) => roles.includes(r)) || roles[0] || null;
}

// 새로고침해도 마지막으로 보던 플랫폼/역할/메뉴로 복귀하도록 계정별로 localStorage에 남긴다.
function navStorageKey(user) {
	return user ? `reservehub:nav:${user.id ?? user.username}` : null;
}

function loadSavedNav(key) {
	if (!key) return null;
	try {
		return JSON.parse(localStorage.getItem(key));
	} catch {
		return null;
	}
}

export default function AppShell() {
	const navigate = useNavigate();
	// 프로필(이름/이메일/전화번호)은 Web Storage에 남기지 않고 메모리에만 캐시하므로,
	// 새로고침 직후엔 비어있을 수 있다 — 아래 마운트 effect에서 loadCurrentUser로 채운다.
	const [user, setUser] = useState(() => getCurrentUser());
	const navKey = navStorageKey(user);

	const [platforms, setPlatforms] = useState([]);
	const [currentPlatformId, setCurrentPlatformId] = useState(null);
	const [activeRole, setActiveRole] = useState(null);
	const [currentContext, setCurrentContext] = useState("dashboard");
	const [theme, setTheme] = useState(getTheme());
	const [loading, setLoading] = useState(true);
	const [ownerRequests, setOwnerRequests] = useState([]);

	// 플랫폼 전환 패널 — 평소엔 닫혀있고(switcherOpen=false) 현재 플랫폼만 보인다.
	// pickedRole이 null이면 패널 안에 역할 목록을, 값이 있으면 그 역할의 플랫폼 목록을 보여준다.
	const [switcherOpen, setSwitcherOpen] = useState(false);
	const [pickedRole, setPickedRole] = useState(null);
	const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
	const switcherRef = useRef(null);
	const flyoutRef = useRef(null);
	const roleRowRefs = useRef({});
	const closeTimeoutRef = useRef(null);

	function closeSwitcher() {
		setSwitcherOpen(false);
		setPickedRole(null);
	}

	// flyout이 포털(document.body)이라 tier-current와 마우스 영역이 붙어있지 않다 — 그 사이
	// 몇 px 간격을 지나가는 순간 mouseleave가 먼저 잡혀서 닫혀버리는 걸 막기 위해, 바로 닫지
	// 않고 살짝 지연시켰다가, 그 안에 tier-current나 flyout으로 다시 들어오면 취소한다.
	function cancelScheduledClose() {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	}
	function scheduleClose() {
		cancelScheduledClose();
		closeTimeoutRef.current = setTimeout(closeSwitcher, 200);
	}
	useEffect(() => () => cancelScheduledClose(), []);

	// .sidebar가 overflow:hidden이라(접힘 너비 트랜지션 때문에 필요) 그 안에서 옆으로 튀어나오는
	// tier-side-flyout은 사이드바 경계에서 잘려 안 보인다 — document.body에 포털로 띄우고,
	// 클릭한 줄의 화면 좌표(viewport 기준)를 재서 position:fixed로 그 옆에 위치시킨다.
	function toggleRoleFlyout(role) {
		setPickedRole((prev) => {
			if (prev === role) return null;
			const rowEl = roleRowRefs.current[role];
			if (rowEl) {
				const rect = rowEl.getBoundingClientRect();
				const left = Math.min(rect.right + 6, window.innerWidth - 200);
				setFlyoutPos({ top: rect.top, left });
			}
			return role;
		});
	}

	// 모바일/터치에서는 hover가 없어 클릭으로 열리는데, 그 경우 바깥을 눌러야 닫히도록 처리한다.
	// tier-side-flyout은 포털이라 실제 DOM에서는 switcherRef 바깥(body 밑)에 있으므로 따로 확인한다.
	useEffect(() => {
		if (!switcherOpen) return;
		function handleOutsideClick(e) {
			const insideSwitcher = switcherRef.current?.contains(e.target);
			const insideFlyout = flyoutRef.current?.contains(e.target);
			if (!insideSwitcher && !insideFlyout) closeSwitcher();
		}
		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [switcherOpen]);

	const refreshPlatforms = useCallback(async () => {
		const data = await listPlatforms();
		setPlatforms(data);
		setCurrentPlatformId((prev) => {
			if (prev && data.some((p) => p.id === prev)) return prev;
			// 메모리 캐시가 이미 갱신돼 있을 수 있어 상태값(user)이 아니라 getCurrentUser()를 직접 읽는다.
			const saved = loadSavedNav(navStorageKey(getCurrentUser()));
			if (saved?.platformId && data.some((p) => p.id === saved.platformId)) return saved.platformId;
			return data[0]?.id ?? null;
		});
		return data;
	}, []);

	useEffect(() => {
		(async () => {
			try {
				let current = user;
				if (!current) {
					current = await loadCurrentUser();
					if (!current) {
						navigate("/login", { replace: true });
						return;
					}
					setUser(current);
				}
				await refreshPlatforms();
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshPlatforms]);

	const currentPlatform = platforms.find((p) => p.id === currentPlatformId) || null;
	const ownerPlatforms = platforms.filter((p) => p.roles.includes("OWNER"));

	const refreshOwnerRequests = useCallback(async () => {
		const platformList = platforms.filter((p) => p.roles.includes("OWNER"));
		if (!platformList.length) {
			setOwnerRequests([]);
			return;
		}
		const [scheduleRequests, leaveRequests] = await Promise.all([
			listAllScheduleRequests(platformList),
			listAllLeaveRequests(platformList)
		]);
		setOwnerRequests([...scheduleRequests, ...leaveRequests]);
	}, [platforms]);

	// 플랫폼을 바꿨을 때만 강조 역할(activeRole)을 재계산한다 — 메뉴 항목 클릭(selectMenuItem)으로
	// activeRole이 바뀌는 것과 겹치지 않도록 currentPlatformId 변경 시에만 동작시킨다.
	useEffect(() => {
		if (!currentPlatform) {
			setActiveRole(null);
			return;
		}
		if (activeRole && currentPlatform.roles.includes(activeRole)) return;
		const saved = loadSavedNav(navKey);
		const savedMatches =
			saved?.platformId === currentPlatform.id && currentPlatform.roles.includes(saved.role);
		const next = savedMatches ? saved.role : pickActiveRole(currentPlatform.roles);
		setActiveRole(next);
		setCurrentContext(
			savedMatches && saved.context ? saved.context : DEFAULT_CONTEXT[next] || "calendar"
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPlatformId, platforms]);

	// 플랫폼/역할/메뉴를 바꿀 때마다 계정별 키로 남겨서, 새로고침해도 마지막 화면으로 복귀시킨다.
	useEffect(() => {
		if (!navKey || !currentPlatformId || !activeRole) return;
		try {
			localStorage.setItem(
				navKey,
				JSON.stringify({ platformId: currentPlatformId, role: activeRole, context: currentContext })
			);
		} catch {
			// localStorage 접근 불가(프라이빗 모드 등)는 조용히 무시 — 복원 실패해도 기본 동작에는 지장 없다.
		}
	}, [navKey, currentPlatformId, activeRole, currentContext]);

	useEffect(() => {
		if (ownerPlatforms.length) refreshOwnerRequests();
	}, [ownerPlatforms.length, refreshOwnerRequests]);

	// USER(수강생)는 스태프 역할과 성격이 완전히 달라 화면을 통째로 전환하는 편이 자연스럽고,
	// 스태프 역할끼리(OWNER/MANAGER/TUTOR)는 업무가 겹치므로 메뉴를 한 화면에 합쳐 보여준다.
	// 예: 홍대요가(매니저+수강생) → 버튼으로 전환 / 잠실댄스(매니저+강사) → 두 섹션 동시 노출.
	const currentRoles = currentPlatform?.roles || [];
	const isMergedPlatform = currentRoles.length > 1 && !currentRoles.includes("USER");

	// 플랫폼 전환 패널에서 역할별 목록 중 하나를 골랐을 때 — 플랫폼과 역할을 함께 확정하고
	// 패널을 닫는다 (한 플랫폼이 여러 역할을 가져도 어느 역할 목록에서 눌렀는지로 역할이 정해진다).
	function selectTierPlatform(role, platform) {
		setCurrentPlatformId(platform.id);
		setActiveRole(role);
		setCurrentContext(DEFAULT_CONTEXT[role] || "calendar");
		closeSwitcher();
	}

	// 마우스를 올렸을 때 tier-current-btn 위/아래로 나오는 역할 한 줄 — 클릭하면 그 역할의
	// 플랫폼 목록이 옆으로 튀어나온다(tier-side-flyout, tier-current 바로 아래에 별도로 그려짐).
	function renderRoleRow(role) {
		return (
			<div className="tier-role-row" key={role} ref={(el) => (roleRowRefs.current[role] = el)}>
				<button type="button" className="tier-role-item" onClick={() => toggleRoleFlyout(role)}>
					<span>{TIER_LABEL[role]}</span>
					<span className="tier-role-caret">›</span>
				</button>
			</div>
		);
	}

	function selectMenuItem(role, itemId) {
		setActiveRole(role);
		setCurrentContext(itemId);
	}

	async function handleLogout() {
		await clearSession();
		navigate("/login");
	}

	const sectionRoles = isMergedPlatform
		? ROLE_PRIORITY.filter((r) => currentRoles.includes(r))
		: activeRole
			? [activeRole]
			: [];
	const menuSections = sectionRoles.map((role) => {
		const commonMenu = NO_CALENDAR_ROLES.includes(role)
			? COMMON_MENU.filter((m) => m.id !== "calendar")
			: COMMON_MENU;
		return {
			role,
			items: SHARED_BOTTOM_ROLES.includes(role) ? ROLE_MENU[role] || [] : [...(ROLE_MENU[role] || []), ...commonMenu]
		};
	});
	const showSharedMenu = sectionRoles.some((role) => SHARED_BOTTOM_ROLES.includes(role));
	const activeSection = menuSections.find((s) => s.role === activeRole);
	const topbarTitle =
		activeSection?.items.find((m) => m.id === currentContext)?.label ||
		(showSharedMenu ? COMMON_MENU.find((m) => m.id === currentContext)?.label : undefined) ||
		"";
	const pendingOwnerCount = ownerRequests.filter((r) => r.status === "PENDING").length;

	// 현재 플랫폼(tier-current-btn)을 기준으로, ROLE_PRIORITY 순서상 그보다 앞선 역할은 위에,
	// 뒤쪽 역할은 아래에 나열한다 — 배정된 플랫폼이 없는 역할은 애초에 후보에서 빠진다.
	// switcherOpen과 무관하게 항상 DOM에 그려두고, CSS(grid-template-rows)로 접었다 펴서
	// 열고 닫을 때 영역 자체가 부드럽게 늘어나고 tier-current-btn이 밀려나도록 한다.
	const enabledRoles = ROLE_PRIORITY.filter((role) => platforms.some((p) => p.roles.includes(role)));
	const currentRoleIndex = enabledRoles.indexOf(activeRole);
	const aboveRoles = enabledRoles.slice(0, currentRoleIndex);
	const belowRoles = enabledRoles.slice(currentRoleIndex + 1);

	return (
		<div className="app" id={SHELL_ID[activeRole] || "manager-app"}>
			<div className="overlay" onClick={closeSidebar}></div>

			<nav className="sidebar">
				<div className="sidebar-top">
					<div className="logo">
						<div className="logo-icon">🗓</div>
						<span className="logo-text">ReserveHub</span>
					</div>
					<div className="sidebar-top-actions">
						<button
							className="theme-toggle"
							title="테마 전환"
							onClick={() => setTheme(toggleTheme())}
						>
							{theme === "dark" ? "☀️" : "🌙"}
						</button>
						<button className="collapse-btn" onClick={toggleCollapse}>
							◀
						</button>
					</div>
				</div>

				<div className="tier-switch">
					<div className="tier-switch-label">플랫폼 전환</div>
					{!loading && platforms.length === 0 && (
						<div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "4px 2px" }}>
							배정된 플랫폼이 없습니다
						</div>
					)}
					{currentPlatform && (
						<div
							className="tier-current"
							ref={switcherRef}
							onMouseEnter={() => {
								cancelScheduledClose();
								setSwitcherOpen(true);
							}}
							onMouseLeave={scheduleClose}
						>
							<div className={`tier-expand${switcherOpen ? " open" : ""}`}>
								<div className="tier-expand-inner">{aboveRoles.map(renderRoleRow)}</div>
							</div>
							<button
								type="button"
								className="tier-current-btn"
								ref={(el) => (roleRowRefs.current[activeRole] = el)}
								onClick={() => {
									setSwitcherOpen(true);
									toggleRoleFlyout(activeRole);
								}}
							>
								<span className="plat-dot" style={{ background: currentPlatform.colorHex }}></span>
								<span>{currentPlatform.name}</span>
								<span className="tier-current-caret">▾</span>
							</button>
							<div className={`tier-expand${switcherOpen ? " open" : ""}`}>
								<div className="tier-expand-inner">{belowRoles.map(renderRoleRow)}</div>
							</div>

							{pickedRole &&
								createPortal(
									<div
										ref={flyoutRef}
										className="tier-side-flyout"
										style={{ top: flyoutPos.top, left: flyoutPos.left }}
										onMouseEnter={cancelScheduledClose}
										onMouseLeave={scheduleClose}
									>
										{platforms
											.filter((p) => p.roles.includes(pickedRole))
											.map((p) => (
												<button
													type="button"
													key={p.id}
													className={`tier-dropdown-item${currentPlatformId === p.id && activeRole === pickedRole ? " active" : ""}`}
													onClick={() => selectTierPlatform(pickedRole, p)}
												>
													<span className="plat-dot" style={{ background: p.colorHex }}></span>
													<span>{p.name}</span>
												</button>
											))}
									</div>,
									document.body
								)}
						</div>
					)}
				</div>

				<div className="user-card">
					<div className="avatar">{(user?.name || displayName(user))[0]}</div>
					<div className="user-info">
						<div className="user-name">{user?.name || displayName(user)}</div>
						<div className="user-role">{ROLE_LABEL[activeRole] || "-"}</div>
					</div>
				</div>

				<div className="nav">
					{menuSections.map((section) => (
						<div className="nav-section" key={section.role}>
							{menuSections.length > 1 && (
								<div className="nav-section-label">{ROLE_LABEL[section.role]}</div>
							)}
							{section.items.map((m) => (
								<button
									key={`${section.role}-${m.id}`}
									className={`nav-item ${activeRole === section.role && currentContext === m.id ? "active" : ""}`}
									onClick={() => selectMenuItem(section.role, m.id)}
								>
									<span className="nav-icon">{m.icon}</span>
									<span className="nav-label">{m.label}</span>
									{m.id === "approval" && section.role === "OWNER" && pendingOwnerCount > 0 && (
										<span
											style={{
												marginLeft: "auto",
												background: "var(--owner)",
												color: "white",
												fontSize: "10px",
												fontWeight: 700,
												padding: "1px 6px",
												borderRadius: "10px",
												flexShrink: 0
											}}
										>
											{pendingOwnerCount}
										</span>
									)}
								</button>
							))}
						</div>
					))}
					{showSharedMenu && (
						<div className="nav-section">
							{menuSections.length > 1 && <div className="nav-section-label">공유</div>}
							{COMMON_MENU.map((m) => (
								<button
									key={`shared-${m.id}`}
									className={`nav-item ${currentContext === m.id ? "active" : ""}`}
									onClick={() => setCurrentContext(m.id)}
								>
									<span className="nav-icon">{m.icon}</span>
									<span className="nav-label">{m.label}</span>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="sidebar-bottom">
					<button className="btn-logout" onClick={handleLogout}>
						🚪 <span>로그아웃</span>
					</button>
				</div>
			</nav>

			<div className="main">
				<div className="topbar">
					<button className="hamburger" onClick={openSidebar}>
						☰
					</button>
					<div className="topbar-title">{topbarTitle}</div>
					<div className="topbar-right">
						<button className="notif-btn" title="알림">
							🔔<span className="notif-dot"></span>
						</button>
					</div>
				</div>

				<div className="content">{renderContent()}</div>
			</div>
		</div>
	);

	function renderContent() {
		if (loading)
			return (
				<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
					불러오는 중...
				</div>
			);
		if (!activeRole)
			return (
				<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
					배정된 플랫폼이 없습니다
				</div>
			);

		if (currentContext === "calendar") {
			switch (activeRole) {
				case "OWNER":
				case "MANAGER":
					return <ManagerCalendarView platformId={currentPlatformId} />;
				case "TUTOR":
					return <TutorCalendarView />;
				case "TAX_ACCOUNTANT":
					// 메뉴에서 뺐지만, 예전에 저장된 nav 복원 등으로 혹시 여기 들어와도 안전하게 처리.
					return null;
				default:
					return <UserCalendarView />;
			}
		}
		if (currentContext === "mypage") {
			switch (activeRole) {
				case "OWNER":
					return <OwnerMypageView user={user} platforms={ownerPlatforms} />;
				case "MANAGER":
					return (
						<ManagerMypageView platformId={currentPlatformId} currentPlatform={currentPlatform} />
					);
				case "TUTOR":
					return <TutorMypageView />;
				case "TAX_ACCOUNTANT":
					return <TaxAccountantMypageView />;
				default:
					return <UserMypageView />;
			}
		}

		if (activeRole === "OWNER") {
			switch (currentContext) {
				case "dashboard":
					return (
						<OwnerDashboardView
							platforms={ownerPlatforms}
							requests={ownerRequests}
							onDecided={refreshOwnerRequests}
							onNavigate={setCurrentContext}
						/>
					);
				case "platform":
					return (
						<OwnerPlatformView
							platforms={ownerPlatforms}
							currentPlatformId={currentPlatformId}
							onSelectPlatform={setCurrentPlatformId}
							onPlatformsChanged={refreshPlatforms}
						/>
					);
				case "facility":
					return <OwnerFacilityView platformId={currentPlatformId} />;
				case "facilityStatus":
					return <ManagerFacilityView platformId={currentPlatformId} />;
				case "approval":
					return <OwnerApprovalView requests={ownerRequests} onDecided={refreshOwnerRequests} />;
				default:
					return null;
			}
		}

		if (activeRole === "MANAGER") {
			switch (currentContext) {
				case "dashboard":
					return (
						<ManagerDashBoardView
							onNavigate={setCurrentContext}
							platformId={currentPlatformId}
							platformName={currentPlatform?.name}
						/>
					);
				case "approval":
					return <ManagerApprovalView platformId={currentPlatformId} />;
				case "members":
					return <ManagerMemberManageView platformId={currentPlatformId} />;
				case "tutor":
					return <ManagerTutorManageView platformId={currentPlatformId} />;
				case "payment":
					return <ManagerPaymentView platformId={currentPlatformId} />;
				case "paymentHistory":
					return <ManagerPaymentHistoryView platformId={currentPlatformId} />;
				case "lessonManage":
					return <ManagerLessonManageView platformId={currentPlatformId} />;
				case "facilityStatus":
					return <ManagerFacilityView platformId={currentPlatformId} />;
				case "calc":
					return (
						<ManagerCalculationView
							platformId={currentPlatformId}
							platformName={currentPlatform?.name}
						/>
					);
				case "history":
					return <ManagerStudyHistoryView platformId={currentPlatformId} />;
				case "activityLog":
					return <ManagerActivityLogView platformId={currentPlatformId} />;
				default:
					return null;
			}
		}

		if (activeRole === "TUTOR") {
			switch (currentContext) {
				case "attendance":
					return <TutorAttendanceView platformId={currentPlatformId} />;
				case "attendHistory":
					return <TutorAttendanceHistoryView platformId={currentPlatformId} />;
				case "schedule":
					return <TutorScheduleRequestView platformId={currentPlatformId} />;
				case "facilityReport":
					return <TutorFacilityReportView platformId={currentPlatformId} />;
				default:
					return null;
			}
		}

		if (activeRole === "TAX_ACCOUNTANT") {
			switch (currentContext) {
				case "revenue":
					return (
						<TaxAccountantRevenueView platformId={currentPlatformId} platformName={currentPlatform?.name} />
					);
				case "payroll":
					return <TaxAccountantStaffView platformId={currentPlatformId} />;
				case "finCalendar":
					return (
						<TaxAccountantCalendarView platformId={currentPlatformId} platformName={currentPlatform?.name} />
					);
				default:
					return null;
			}
		}

		switch (currentContext) {
			case "reservation":
				return <UserReservationView />;
			case "facility":
				return <UserFacilityBookingView platformId={currentPlatformId} />;
			default:
				return null;
		}
	}
}
