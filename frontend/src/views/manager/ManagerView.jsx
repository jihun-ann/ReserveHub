import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { closeSidebar, toggleCollapse, openSidebar } from "../default.js";
import { getTheme, toggleTheme } from "../../theme.js";
import "./ManagerView.css";
import { getCurrentUser, clearSession, displayName } from "../../api/http.js";
import { listPlatforms, hexAlpha } from "../../api/common.js";
import ManagerApprovalView from "./ManagerApprovalView.jsx";
import ManagerCalculationView from "./ManagerCalculationView.jsx";
import ManagerCalendarView from "./ManagerCalendarView.jsx";
import ManagerDashBoardView from "./ManagerDashBoardView.jsx";
import ManagerMemberManageView from "./ManagerMemberManageView.jsx";
import ManagerMypageView from "./ManagerMypageView.jsx";
import ManagerPaymentView from "./ManagerPaymentView.jsx";
import ManagerStudyHistoryView from "./ManagerStudyHistoryView.jsx";
import ManagerTutorManageView from "./ManagerTutorManageView.jsx";

export default function ManagerView() {
	const navigate = useNavigate();
	const user = getCurrentUser();

	const [platforms, setPlatforms] = useState([]);
	const [currentPlatformId, setCurrentPlatformId] = useState(null);
	const [currentContext, setCurrentContext] = useState("dashboard");
	const [theme, setTheme] = useState(getTheme());

	const refreshPlatforms = useCallback(async () => {
		const data = await listPlatforms();
		setPlatforms(data);
		setCurrentPlatformId((prev) => prev ?? data[0]?.id ?? null);
	}, []);

	useEffect(() => {
		refreshPlatforms();
	}, [refreshPlatforms]);

	const currentPlatform = platforms.find((p) => p.id === currentPlatformId) || null;

	function handleLogout() {
		clearSession();
		navigate("/login");
	}

	return (
		<div className="app" id="manager-app">
			<div className="overlay" id="manager-overlay" onClick={closeSidebar}></div>

			{/* ══ 사이드바 ══ */}
			<nav className="sidebar" id="manager-sidebar">
				<div className="sidebar-top">
					<div className="logo">
						<div className="logo-icon">🏪</div>
						<span className="logo-text">ReserveHub</span>
					</div>
					<div className="sidebar-top-actions">
						<button className="theme-toggle" title="테마 전환" onClick={() => setTheme(toggleTheme())}>
							{theme === "dark" ? "☀️" : "🌙"}
						</button>
						<button className="collapse-btn" onClick={toggleCollapse}>
							◀
						</button>
					</div>
				</div>

				{/* 플랫폼 전환 */}
				<div className="plat-switch">
					<div className="plat-switch-label">담당 플랫폼</div>
					{platforms.length === 0 && (
						<div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "4px 2px" }}>배정된 플랫폼이 없습니다</div>
					)}
					{platforms.map((p) => (
						<button
							key={p.id}
							className={`plat-tab-btn ${currentPlatformId === p.id ? "active" : ""}`}
							onClick={() => setCurrentPlatformId(p.id)}
						>
							<div className="plat-dot" style={{ background: p.colorHex }}></div>
							<span>{p.name}</span>
						</button>
					))}
				</div>

				<div className="user-card">
					<div className="avatar">{(user?.name || displayName(user))[0]}</div>
					<div className="user-info">
						<div className="user-name">{user?.name || displayName(user)}</div>
						<div className="user-role">매니저</div>
					</div>
				</div>

				<div className="nav" id="manager-nav">
					<button
						className={`nav-item ${currentContext === "dashboard" ? "active" : ""}`}
						onClick={() => showPage("dashboard")}
					>
						<span className="nav-icon">📊</span>
						<span className="nav-label">대시보드</span>
					</button>
					<button
						className={`nav-item ${currentContext === "approval" ? "active" : ""}`}
						onClick={() => showPage("approval")}
					>
						<span className="nav-icon">✅</span>
						<span className="nav-label">승인 관리</span>
						<span className="nav-badge" id="approval-badge">
							2
						</span>
					</button>
					<button
						className={`nav-item ${currentContext === "members" ? "active" : ""}`}
						onClick={() => showPage("members")}
					>
						<span className="nav-icon">👥</span>
						<span className="nav-label">회원 관리</span>
					</button>
					<button
						className={`nav-item ${currentContext === "tutor" ? "active" : ""}`}
						onClick={() => showPage("tutor")}
					>
						<span className="nav-icon">🧑‍🏫</span>
						<span className="nav-label">강사 관리</span>
					</button>
					<button
						className={`nav-item ${currentContext === "payment" ? "active" : ""}`}
						onClick={() => showPage("payment")}
					>
						<span className="nav-icon">💳</span>
						<span className="nav-label">수강권 / 결제</span>
					</button>
					<button
						className={`nav-item ${currentContext === "calc" ? "active" : ""}`}
						onClick={() => showPage("calc")}
					>
						<span className="nav-icon">🧮</span>
						<span className="nav-label">상담 계산툴</span>
					</button>
					<button
						className={`nav-item ${currentContext === "calendar" ? "active" : ""}`}
						onClick={() => showPage("calendar")}
					>
						<span className="nav-icon">📅</span>
						<span className="nav-label">캘린더</span>
					</button>
					<button
						className={`nav-item ${currentContext === "history" ? "active" : ""}`}
						onClick={() => showPage("history")}
					>
						<span className="nav-icon">📋</span>
						<span className="nav-label">수업 이력</span>
					</button>
					<button
						className={`nav-item ${currentContext === "mypage" ? "active" : ""}`}
						onClick={() => showPage("mypage")}
					>
						<span className="nav-icon">👤</span>
						<span className="nav-label">내 정보</span>
					</button>
				</div>

				<div className="sidebar-bottom">
					<button className="btn-logout" onClick={handleLogout}>
						🚪 <span>로그아웃</span>
					</button>
				</div>
			</nav>

			{/* ══ 메인 ══ */}
			<div className="main">
				<div className="topbar">
					<button className="hamburger" onClick={openSidebar}>
						☰
					</button>
					<div className="topbar-title" id="topbar-title">
						<SetTopbarTitle currentContext={currentContext} />
					</div>
					{currentPlatform && (
						<span
							className="topbar-plat"
							id="topbar-plat"
							style={{ background: hexAlpha(currentPlatform.colorHex, 0.12), color: currentPlatform.colorHex }}
						>
							{currentPlatform.emoji} {currentPlatform.name}
						</span>
					)}
					<div className="topbar-right">
						<button className="notif-btn" title="알림">
							🔔<span className="notif-dot"></span>
						</button>
					</div>
				</div>

				<div className="content">
					<RenderContext currentContext={currentContext} currentPlatform={currentPlatform} />
				</div>
				{/* /content */}
			</div>
			{/* /main */}
		</div>
	);

	function showPage(parm) {
		setCurrentContext(parm);
	}

	//변경된 컨텐츠 적용
	function RenderContext({ currentContext, currentPlatform }) {
		switch (currentContext) {
			case "dashboard":
				return <ManagerDashBoardView onNavigate={showPage} platformId={currentPlatformId} platformName={currentPlatform?.name} />;
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
			case "calendar":
				return <ManagerCalendarView platformId={currentPlatformId} />;
			case "history":
				return <ManagerStudyHistoryView platformId={currentPlatformId} />;
			case "mypage":
				return <ManagerMypageView platformId={currentPlatformId} currentPlatform={currentPlatform} />;
			default:
				return <ManagerDashBoardView onNavigate={showPage} platformId={currentPlatformId} platformName={currentPlatform?.name} />;
		}
	}

	function SetTopbarTitle({ currentContext }) {
		switch (currentContext) {
			case "dashboard":
				return "대시보드";
			case "approval":
				return "승인관리";
			case "members":
				return "회원관리";
			case "tutor":
				return "강사관리";
			case "payment":
				return "결제관리";
			case "calc":
				return "계산툴";
			case "calendar":
				return "캘린더";
			case "history":
				return "수강이력";
			case "mypage":
				return "마이페이지";
			default:
				return "대시보드";
		}
	}
}
