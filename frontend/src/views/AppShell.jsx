import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { closeSidebar, toggleCollapse, openSidebar } from "./default.js";
import { getTheme, toggleTheme } from "../theme.js";
import "./manager/ManagerView.css";
import "./tutor/TutorView.css";
import "./owner/OwnerView.css";
import "./user/UserView.css";
import { getCurrentUser, clearSession, displayName } from "../api/http.js";
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

// 우선순위: 한 플랫폼에서 여러 역할을 가져도 기본으로 보여줄 역할은 하나 — 스태프 성격이 강한
// 순서로 고른다. 같은 플랫폼을 다시 클릭하면 이 순서와 무관하게 roles 배열을 순환한다.
const ROLE_PRIORITY = ["OWNER", "MANAGER", "TUTOR", "USER"];

// 각 역할의 기존 화면 전체(레이아웃 포함)가 이미 #owner-app/#manager-app/#tutor-app/#user-app로
// 스코프된 CSS를 갖고 있어서, 셸 루트의 id만 바꾸면 색상 테마가 그대로 따라온다.
const SHELL_ID = { OWNER: "owner-app", MANAGER: "manager-app", TUTOR: "tutor-app", USER: "user-app" };
const ROLE_LABEL = { OWNER: "대표", MANAGER: "매니저", TUTOR: "강사", USER: "수강생" };
const DEFAULT_CONTEXT = { OWNER: "dashboard", MANAGER: "dashboard", TUTOR: "calendar", USER: "calendar" };

const COMMON_MENU = [
	{ id: "calendar", label: "캘린더", icon: "📅" },
	{ id: "mypage", label: "내 정보", icon: "👤" }
];
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

export default function AppShell() {
	const navigate = useNavigate();
	const user = getCurrentUser();

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
		setCurrentPlatformId((prev) => (prev && data.some((p) => p.id === prev) ? prev : data[0]?.id ?? null));
		return data;
	}, []);

	useEffect(() => {
		(async () => {
			try {
				await refreshPlatforms();
			} finally {
				setLoading(false);
			}
		})();
	}, [refreshPlatforms]);

	const currentPlatform = platforms.find((p) => p.id === currentPlatformId) || null;
	const ownerPlatforms = platforms.filter((p) => p.roles.includes("OWNER"));

	const refreshOwnerRequests = useCallback(async () => {
		const platformList = platforms.filter((p) => p.roles.includes("OWNER"));
		setOwnerRequests(platformList.length ? await listAllScheduleRequests(platformList) : []);
	}, [platforms]);

	// 플랫폼을 바꿨을 때만 활성 역할을 재계산한다 — 같은 플랫폼을 다시 눌러 역할을 순환하는
	// 동작(selectPlatform)과 겹치지 않도록 currentPlatformId 변경 시에만 동작시킨다.
	useEffect(() => {
		if (!currentPlatform) {
			setActiveRole(null);
			return;
		}
		if (activeRole && currentPlatform.roles.includes(activeRole)) return;
		const next = pickActiveRole(currentPlatform.roles);
		setActiveRole(next);
		setCurrentContext(DEFAULT_CONTEXT[next] || "calendar");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPlatformId, platforms]);

	useEffect(() => {
		if (activeRole === "OWNER") refreshOwnerRequests();
	}, [activeRole, refreshOwnerRequests]);

	function selectPlatform(platform) {
		if (platform.id !== currentPlatformId) {
			setCurrentPlatformId(platform.id);
			return;
		}
		const roles = platform.roles || [];
		if (roles.length <= 1) return;
		const nextRole = roles[(roles.indexOf(activeRole) + 1) % roles.length];
		setActiveRole(nextRole);
		setCurrentContext(DEFAULT_CONTEXT[nextRole] || "calendar");
	}

	function handleLogout() {
		clearSession();
		navigate("/login");
	}

	const menu = [...(ROLE_MENU[activeRole] || []), ...COMMON_MENU];
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
						<button className="theme-toggle" title="테마 전환" onClick={() => setTheme(toggleTheme())}>
							{theme === "dark" ? "☀️" : "🌙"}
						</button>
						<button className="collapse-btn" onClick={toggleCollapse}>◀</button>
					</div>
				</div>

				<div className="plat-switch">
					<div className="plat-switch-label">담당 플랫폼</div>
					{!loading && platforms.length === 0 && (
						<div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "4px 2px" }}>배정된 플랫폼이 없습니다</div>
					)}
					{platforms.map((p) => (
						<button
							key={p.id}
							className={`plat-tab-btn ${currentPlatformId === p.id ? "active" : ""}`}
							title={p.roles.length > 1 ? "다시 클릭하면 이 플랫폼에서의 다른 역할로 전환합니다" : undefined}
							onClick={() => selectPlatform(p)}
						>
							<div className="plat-dot" style={{ background: p.colorHex }}></div>
							<span>{p.name}</span>
							{currentPlatformId === p.id && p.roles.length > 1 && (
								<span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text-dim)", flexShrink: 0 }}>
									{ROLE_LABEL[activeRole]} ⇄
								</span>
							)}
						</button>
					))}
				</div>

				<div className="user-card">
					<div className="avatar">{(user?.name || displayName(user))[0]}</div>
					<div className="user-info">
						<div className="user-name">{user?.name || displayName(user)}</div>
						<div className="user-role">{ROLE_LABEL[activeRole] || "-"}</div>
					</div>
				</div>

				<div className="nav">
					{menu.map((m) => (
						<button
							key={m.id}
							className={`nav-item ${currentContext === m.id ? "active" : ""}`}
							onClick={() => setCurrentContext(m.id)}
						>
							<span className="nav-icon">{m.icon}</span>
							<span className="nav-label">{m.label}</span>
							{m.id === "approval" && activeRole === "OWNER" && pendingOwnerCount > 0 && (
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

				<div className="sidebar-bottom">
					<button className="btn-logout" onClick={handleLogout}>🚪 <span>로그아웃</span></button>
				</div>
			</nav>

			<div className="main">
				<div className="topbar">
					<button className="hamburger" onClick={openSidebar}>☰</button>
					<div className="topbar-title">{menu.find((m) => m.id === currentContext)?.label || ""}</div>
					<div className="topbar-right">
						<button className="notif-btn" title="알림">🔔<span className="notif-dot"></span></button>
					</div>
				</div>

				<div className="content">{renderContent()}</div>
			</div>
		</div>
	);

	function renderContent() {
		if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>;
		if (!activeRole) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>배정된 플랫폼이 없습니다</div>;

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
					return <ManagerMypageView platformId={currentPlatformId} currentPlatform={currentPlatform} />;
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
					return <ManagerDashBoardView onNavigate={setCurrentContext} platformId={currentPlatformId} platformName={currentPlatform?.name} />;
				case "approval":
					return <ManagerApprovalView platformId={currentPlatformId} />;
				case "members":
					return <ManagerMemberManageView platformId={currentPlatformId} />;
				case "tutor":
					return <ManagerTutorManageView platformId={currentPlatformId} />;
				case "payment":
					return <ManagerPaymentView platformId={currentPlatformId} />;
				case "calc":
					return <ManagerCalculationView platformId={currentPlatformId} platformName={currentPlatform?.name} />;
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
