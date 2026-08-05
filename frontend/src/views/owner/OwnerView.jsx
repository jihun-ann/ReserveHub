import { useState } from "react";
import { toggleCollapse, closeSidebar, openSidebar } from "../default.js";
import "./OwnerView.css";
import OwnerDashboardView from "./OwnerDashboardView.jsx";
import OwnerApprovalView from "./OwnerApprovalView.jsx";
import OwnerPlatformView from "./OwnerPlatformView.jsx";
import OwnerMypageView from "./OwnerMypageView.jsx";

export default function OwnerView() {
	const [currentPlatform, setCurrentPlatform] = useState("pilates");
	const [currentContext, setCurrentContext] = useState("dashboard");

	return (
		<div id="owner-app">
			{/* 모바일 오버레이 */}
			<div className="overlay" id="owner-overlay" onClick={closeSidebar}></div>

			{/* ── 사이드바 ── */}
			<nav className="sidebar" id="owner-sidebar">
				<div className="sidebar-top">
					<div className="logo">
						<div className="logo-icon">🗓</div>
						<span className="logo-text">ReserveHub</span>
					</div>
					<button className="collapse-btn" onClick={toggleCollapse}>
						◀
					</button>
				</div>

				{/* 플랫폼 전환 */}
				<div className="plat-switch">
					<div className="plat-switch-label">담당 플랫폼</div>
					<button
						className={`plat-tab-btn ${currentPlatform === "pilates" ? "active" : ""}`}
						id="platTab-pilates"
						onClick={() => switchPlat("pilates")}
					>
						<div className="plat-dot" style={{ background: "#7c6af7" }}></div>
						<span>스튜디오 필라테스 강남</span>
					</button>
					<button
						className={`plat-tab-btn ${currentPlatform === "yoga" ? "active" : ""}`}
						id="platTab-yoga"
						onClick={() => switchPlat("yoga")}
					>
						<div className="plat-dot" style={{ background: "#4fd1c5" }}></div>
						<span>요가라운지 홍대</span>
					</button>
				</div>

				{/*로그인 데이터를 받아 처리할 항목*/}
				<div className="user-card">
					<div className="avatar">김</div>
					<div className="user-info">
						<div className="user-name">김갑수</div>
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
						<span
							style={{
								marginLeft: "auto",
								background: "#f87171",
								color: "white",
								fontSize: "10px",
								fontWeight: 700,
								padding: "1px 6px",
								borderRadius: "10px",
								flexShrink: 0,
							}}
						>
							2
						</span>
					</button>
					<button
						className={`nav-item ${currentContext === "mypage" ? "active" : ""}`}
						onClick={() => showPage("mypage")}
					>
						<span className="nav-icon">👤</span>
						<span className="nav-label">내 정보</span>
					</button>
				</div>
			</nav>

			<main className="main" id="owner-main">
				<div className="topbar">
					<button className="hamburger" onClick={openSidebar}>
						☰
					</button>
					<div className="topbar-title" id="topbar-title">
						<SetTopbarTitle currentContext={currentContext} />
					</div>
					<span className="topbar-plat" id="topbar-plat">
						🤸 필라테스 강남
					</span>
					<div className="topbar-right">
						<button className="notif-btn" title="알림">
							🔔<span className="notif-dot"></span>
						</button>
					</div>
				</div>

				<div className="content">
					<RenderContext currentContext={currentContext} currentPlatform={currentPlatform} />
				</div>
			</main>
		</div>
	);
	function switchPlat(parm) {
		setCurrentPlatform(parm);
	}
	function showPage(parm) {
		setCurrentContext(parm);
	}

	function RenderContext({ currentContext, currentPlatform }) {
		switch (currentContext) {
			case "dashboard":
				return <OwnerDashboardView onNavigate={showPage} />;
			case "platform":
				return <OwnerPlatformView />;
			case "approval":
				return <OwnerApprovalView />;
			case "mypage":
				return <OwnerMypageView />;
			default:
				return <OwnerDashboardView onNavigate={showPage} />;
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
