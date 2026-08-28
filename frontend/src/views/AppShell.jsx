import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { closeSidebar, toggleCollapse, openSidebar } from "./default.js";
import { getTheme, toggleTheme } from "../theme.js";
import "./manager/ManagerView.css";
import "./tutor/TutorView.css";
import "./owner/OwnerView.css";
import "./user/UserView.css";
import { getCurrentUser, loadCurrentUser, clearSession, displayName } from "../api/http.js";
import { listPlatforms, listAllScheduleRequests } from "../api/common.js";

import ManagerDashBoardView from "./manager/ManagerDashBoardView.jsx";
import ManagerApprovalView from "./manager/ManagerApprovalView.jsx";
import ManagerMemberManageView from "./manager/ManagerMemberManageView.jsx";
import ManagerTutorManageView from "./manager/ManagerTutorManageView.jsx";
import ManagerPaymentView from "./manager/ManagerPaymentView.jsx";
import ManagerCalculationView from "./manager/ManagerCalculationView.jsx";
import ManagerCalendarView from "./manager/ManagerCalendarView.jsx";
import ManagerStudyHistoryView from "./manager/ManagerStudyHistoryView.jsx";
import ManagerMypageView from "./manager/ManagerMypageView.jsx";

import TutorCalendarView from "./tutor/TutorCalendarView.jsx";
import TutorAttendanceView from "./tutor/TutorAttendanceView.jsx";
import TutorScheduleRequestView from "./tutor/TutorScheduleRequestView.jsx";
import TutorMypageView from "./tutor/TutorMypageView.jsx";

import OwnerDashboardView from "./owner/OwnerDashboardView.jsx";
import OwnerApprovalView from "./owner/OwnerApprovalView.jsx";
import OwnerPlatformView from "./owner/OwnerPlatformView.jsx";
import OwnerMypageView from "./owner/OwnerMypageView.jsx";

import UserCalendarView from "./user/UserCalendarView.jsx";
import UserReservationView from "./user/UserReservationView.jsx";
import UserMypageView from "./user/UserMypageView.jsx";

// 우선순위: 플랫폼 진입 시 기본으로 강조할 역할 하나를 고르는 순서(스태프 성격이 강한 순)이자,
// 메뉴 섹션을 나열하는 순서이기도 하다.
const ROLE_PRIORITY = ["OWNER", "MANAGER", "TUTOR", "USER"];

// 각 역할의 기존 화면 전체(레이아웃 포함)가 이미 #owner-app/#manager-app/#tutor-app/#user-app로
// 스코프된 CSS를 갖고 있어서, 셸 루트의 id만 바꾸면 색상 테마가 그대로 따라온다.
const SHELL_ID = {
	OWNER: "owner-app",
	MANAGER: "manager-app",
	TUTOR: "tutor-app",
	USER: "user-app"
};
const ROLE_LABEL = { OWNER: "대표", MANAGER: "매니저", TUTOR: "강사", USER: "수강생" };
const DEFAULT_CONTEXT = {
	OWNER: "dashboard",
	MANAGER: "dashboard",
	TUTOR: "calendar",
	USER: "calendar"
};

const COMMON_MENU = [
	{ id: "calendar", label: "캘린더", icon: "📅" },
	{ id: "mypage", label: "내 정보", icon: "👤" }
];
// 강사/매니저는 업무가 겹쳐 역할 섹션이 같이 뜨는 경우가 많다 — 캘린더/내 정보를 섹션마다
// 중복 노출하는 대신 사이드바 맨 아래에 공유 메뉴 하나로 뺀다.
const SHARED_BOTTOM_ROLES = ["TUTOR", "MANAGER"];
const ROLE_MENU = {
	OWNER: [
		{ id: "dashboard", label: "대시보드", icon: "📊" },
		{ id: "platform", label: "플랫폼 관리", icon: "🏢" },
		{ id: "approval", label: "승인 관리", icon: "✅" }
	],
	MANAGER: [
		{ id: "dashboard", label: "대시보드", icon: "📊" },
		{ id: "approval", label: "승인 관리", icon: "✅" },
		{ id: "members", label: "회원 관리", icon: "👥" },
		{ id: "tutor", label: "강사 관리", icon: "🧑‍🏫" },
		{ id: "payment", label: "수강권 / 결제", icon: "💳" },
		{ id: "calc", label: "상담 계산툴", icon: "🧮" },
		{ id: "history", label: "수업 이력", icon: "📋" }
	],
	TUTOR: [
		{ id: "attendance", label: "출석 관리", icon: "✅" },
		{ id: "schedule", label: "일정 변경 요청", icon: "📋" }
	],
	USER: [{ id: "reservation", label: "예약하기", icon: "🎯" }]
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
		setOwnerRequests(platformList.length ? await listAllScheduleRequests(platformList) : []);
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

	function selectPlatform(platform) {
		if (platform.id !== currentPlatformId) {
			setCurrentPlatformId(platform.id);
			return;
		}
		const roles = platform.roles || [];
		if (roles.length <= 1 || !roles.includes("USER")) return;
		const nextRole = roles[(roles.indexOf(activeRole) + 1) % roles.length];
		setActiveRole(nextRole);
		setCurrentContext(DEFAULT_CONTEXT[nextRole] || "calendar");
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
	const menuSections = sectionRoles.map((role) => ({
		role,
		items: SHARED_BOTTOM_ROLES.includes(role)
			? ROLE_MENU[role] || []
			: [...(ROLE_MENU[role] || []), ...COMMON_MENU]
	}));
	const showSharedMenu = sectionRoles.some((role) => SHARED_BOTTOM_ROLES.includes(role));
	const activeSection = menuSections.find((s) => s.role === activeRole);
	const topbarTitle =
		activeSection?.items.find((m) => m.id === currentContext)?.label ||
		(showSharedMenu ? COMMON_MENU.find((m) => m.id === currentContext)?.label : undefined) ||
		"";
	const pendingOwnerCount = ownerRequests.filter((r) => r.status === "PENDING").length;

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

				<div className="plat-switch">
					<div className="plat-switch-label">플랫폼</div>
					{!loading && platforms.length === 0 && (
						<div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "4px 2px" }}>
							배정된 플랫폼이 없습니다
						</div>
					)}
					{platforms.map((p) => {
						const multiRole = p.roles.length > 1;
						const togglesRole = multiRole && p.roles.includes("USER");
						return (
							<button
								key={p.id}
								className={`plat-tab-btn ${currentPlatformId === p.id ? "active" : ""}`}
								title={
									togglesRole
										? "다시 클릭하면 이 플랫폼에서의 다른 역할로 전환합니다"
										: multiRole
											? p.roles.map((r) => ROLE_LABEL[r]).join(" / ")
											: undefined
								}
								onClick={() => selectPlatform(p)}
							>
								<div className="plat-dot" style={{ background: p.colorHex }}></div>
								<span>{p.name}</span>
								{togglesRole && currentPlatformId === p.id && (
									<span
										style={{
											marginLeft: "auto",
											fontSize: "10px",
											color: "var(--text-dim)",
											flexShrink: 0
										}}
									>
										{ROLE_LABEL[activeRole]} ⇄
									</span>
								)}
								{multiRole && !togglesRole && (
									<span
										style={{
											marginLeft: "auto",
											fontSize: "10px",
											color: "var(--text-dim)",
											flexShrink: 0
										}}
									>
										{p.roles.map((r) => ROLE_LABEL[r]).join("·")}
									</span>
								)}
							</button>
						);
					})}
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
				case "calc":
					return (
						<ManagerCalculationView
							platformId={currentPlatformId}
							platformName={currentPlatform?.name}
						/>
					);
				case "history":
					return <ManagerStudyHistoryView platformId={currentPlatformId} />;
				default:
					return null;
			}
		}

		if (activeRole === "TUTOR") {
			switch (currentContext) {
				case "attendance":
					return <TutorAttendanceView />;
				case "schedule":
					return <TutorScheduleRequestView />;
				default:
					return null;
			}
		}

		switch (currentContext) {
			case "reservation":
				return <UserReservationView />;
			default:
				return null;
		}
	}
}
