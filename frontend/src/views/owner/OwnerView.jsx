import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toggleCollapse, closeSidebar, openSidebar } from "../default.js";
import { getTheme, toggleTheme } from "../../theme.js";
import "./OwnerView.css";
import { getCurrentUser, clearSession } from "../../api/http.js";
import { listPlatforms, listAllScheduleRequests, hexAlpha } from "../../api/common.js";
import OwnerDashboardView from "./OwnerDashboardView.jsx";
import OwnerApprovalView from "./OwnerApprovalView.jsx";
import OwnerPlatformView from "./OwnerPlatformView.jsx";
import OwnerMypageView from "./OwnerMypageView.jsx";

export default function OwnerView() {
	const navigate = useNavigate();
	const user = getCurrentUser();

	const [platforms, setPlatforms] = useState([]);
	const [currentPlatformId, setCurrentPlatformId] = useState(null);
	const [currentContext, setCurrentContext] = useState("dashboard");
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [theme, setTheme] = useState(getTheme());

	const refreshPlatforms = useCallback(async () => {
		const data = await listPlatforms();
		setPlatforms(data);
		setCurrentPlatformId((prev) => prev ?? data[0]?.id ?? null);
		return data;
	}, []);

	const refreshRequests = useCallback(async (platformList) => {
		if (!platformList?.length) {
			setRequests([]);
			return;
		}
		setRequests(await listAllScheduleRequests(platformList));
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const data = await refreshPlatforms();
				await refreshRequests(data);
			} finally {
				setLoading(false);
			}
		})();
	}, [refreshPlatforms, refreshRequests]);

	const pendingCount = requests.filter((r) => r.status === "PENDING").length;
	const currentPlatform = platforms.find((p) => p.id === currentPlatformId) || null;

	function handleLogout() {
		clearSession();
		navigate("/login");
	}

	return (
		<div className="app" id="owner-app">
			{/* 모바일 오버레이 */}
			<div className="overlay" id="owner-overlay" onClick={closeSidebar}></div>

			{/* ── 사이드바 ── */}
			<nav className="sidebar" id="owner-sidebar">
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
					{platforms.length === 0 && !loading && (
						<div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "4px 2px" }}>등록된 플랫폼이 없습니다</div>
					)}
					{platforms.map((p) => (
						<button
							key={p.id}
							className={`plat-tab-btn ${currentPlatformId === p.id ? "active" : ""}`}
							style={currentPlatformId === p.id ? { background: hexAlpha(p.colorHex, 0.12) } : undefined}
							onClick={() => setCurrentPlatformId(p.id)}
						>
							<div className="plat-dot" style={{ background: p.colorHex }}></div>
							<span>{p.name}</span>
						</button>
					))}
				</div>

				<div className="user-card">
					<div className="avatar">{user?.email?.[0]?.toUpperCase() || "?"}</div>
					<div className="user-info">
						<div className="user-name">{user?.email || "알 수 없음"}</div>
						<div className="user-role">대표</div>
					</div>
				</div>

				<div className="nav">
					<button
						className={`nav-item ${currentContext === "dashboard" ? "active" : ""}`}
						onClick={() => showPage("dashboard")}
					>
						<span className="nav-icon">📊</span>
						<span className="nav-label">대시보드</span>
					</button>
					<button
						className={`nav-item ${currentContext === "platform" ? "active" : ""}`}
						onClick={() => showPage("platform")}
					>
						<span className="nav-icon">🏢</span>
						<span className="nav-label">플랫폼 관리</span>
					</button>
					<button
						className={`nav-item ${currentContext === "approval" ? "active" : ""}`}
						onClick={() => showPage("approval")}
					>
						<span className="nav-icon">✅</span>
						<span className="nav-label">승인 관리</span>
						{pendingCount > 0 && (
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
								{pendingCount}
							</span>
						)}
					</button>
					<button
						className={`nav-item ${currentContext === "mypage" ? "active" : ""}`}
						onClick={() => showPage("mypage")}
					>
						<span className="nav-icon">👤</span>
						<span className="nav-label">내 정보</span>
					</button>
				</div>

				<button className="nav-item" style={{ marginTop: "auto" }} onClick={handleLogout}>
					<span className="nav-icon">🚪</span>
					<span className="nav-label">로그아웃</span>
				</button>
			</nav>

			<main className="main" id="owner-main">
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
							🔔{pendingCount > 0 && <span className="notif-dot"></span>}
						</button>
					</div>
				</div>

				<div className="content">
					{loading ? (
						<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
					) : (
						<RenderContext currentContext={currentContext} />
					)}
				</div>
			</main>
		</div>
	);

	function showPage(parm) {
		setCurrentContext(parm);
	}

	function RenderContext({ currentContext }) {
		switch (currentContext) {
			case "dashboard":
				return (
					<OwnerDashboardView
						platforms={platforms}
						requests={requests}
						onDecided={() => refreshRequests(platforms)}
						onNavigate={showPage}
					/>
				);
			case "platform":
				return (
					<OwnerPlatformView
						platforms={platforms}
						currentPlatformId={currentPlatformId}
						onSelectPlatform={setCurrentPlatformId}
						onPlatformsChanged={refreshPlatforms}
					/>
				);
			case "approval":
				return <OwnerApprovalView requests={requests} onDecided={() => refreshRequests(platforms)} />;
			case "mypage":
				return <OwnerMypageView user={user} platforms={platforms} />;
			default:
				return (
					<OwnerDashboardView
						platforms={platforms}
						requests={requests}
						onDecided={() => refreshRequests(platforms)}
						onNavigate={showPage}
					/>
				);
		}
	}

	function SetTopbarTitle({ currentContext }) {
		switch (currentContext) {
			case "dashboard":
				return "대시보드";
			case "approval":
				return "승인 관리";
			case "platform":
				return "플랫폼 관리";
			case "mypage":
				return "마이페이지";
			default:
				return "대시보드";
		}
	}
}
