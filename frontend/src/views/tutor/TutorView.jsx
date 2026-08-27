import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorView.css";
import { closeSidebar, toggleCollapse, openSidebar } from "../default.js";
import { getTheme, toggleTheme } from "../../theme.js";
import { getCurrentUser, clearSession, displayName } from "../../api/http.js";
import { listPlatforms, hexAlpha } from "../../api/common.js";
import TutorCalendarView from "./TutorCalendarView.jsx";
import TutorAttendanceView from "./TutorAttendanceView.jsx";
import TutorMypageView from "./TutorMypageView.jsx";
import TutorScheduleRequestView from "./TutorScheduleRequestView.jsx";

export default function TutorView() {
	const navigate = useNavigate();
	const user = getCurrentUser();

	const [platforms, setPlatforms] = useState([]);
	const [currentPlatformId, setCurrentPlatformId] = useState(null);
	const [currentContext, setCurrentContext] = useState("calendar");
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
		<div className="app" id="tutor-app">
			{/* 모바일 오버레이 */}
			<div className="overlay" id="tutor-overlay" onClick={closeSidebar}></div>

			{/* ── 사이드바 ── */}
			<nav className="sidebar" id="tutor-sidebar">
				<div className="sidebar-top">
					<div className="logo">
						<div className="logo-icon">🗓</div>
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
						<div className="user-role">트레이너</div>
					</div>
				</div>

				<div className="nav">
					<button
						className={`nav-item ${currentContext === "calendar" ? "active" : ""}`}
						onClick={() => showPage("calendar")}
					>
						<span className="nav-icon">📅</span>
						<span className="nav-label">내 캘린더</span>
					</button>
					<button
						className={`nav-item ${currentContext === "attendance" ? "active" : ""}`}
						onClick={() => showPage("attendance")}
					>
						<span className="nav-icon">✅</span>
						<span className="nav-label">출석 관리</span>
					</button>
					<button
						className={`nav-item ${currentContext === "schedule" ? "active" : ""}`}
						onClick={() => showPage("schedule")}
					>
						<span className="nav-icon">📋</span>
						<span className="nav-label">일정 변경 요청</span>
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

			{/* ── 메인 ── */}
			<div className="main" id="tutor-main">
				<div className="topbar">
					<button className="hamburger" onClick={openSidebar}>
						☰
					</button>
					<div className="topbar-title" id="topbar-title"></div>
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
					<RenderContext currentContext={currentContext} currentPlatformId={currentPlatformId} />
				</div>
			</div>
		</div>
	);

	function showPage(context) {
		setCurrentContext(context);
	}

	function RenderContext({ currentContext, currentPlatformId }) {
		switch (currentContext) {
			case "calendar":
				return <TutorCalendarView platformId={currentPlatformId} />;
			case "attendance":
				return <TutorAttendanceView platformId={currentPlatformId} />;
			case "schedule":
				return <TutorScheduleRequestView platformId={currentPlatformId} />;
			case "mypage":
				return <TutorMypageView platformId={currentPlatformId} currentPlatform={currentPlatform} />;
		}
	}
}
