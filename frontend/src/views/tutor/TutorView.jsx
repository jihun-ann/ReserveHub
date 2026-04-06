import { useEffect, useState } from "react";
import "./TutorView.css";
import { closeSidebar, toggleCollapse, openSidebar } from "../default.js";
import TutorCalendarView from "./TutorCalendarView.jsx";
import TutorAttendanceView from "./TutorAttendanceView.jsx";
import TutorMypageView from "./TutorMypageView.jsx";
import TutorScheduleRequestView from "./TutorScheduleRequestView.jsx";

export default function TutorView() {
	const [currentPlatform, setCurrentPlatform] = useState("pilates");
	const [currentContext, setCurrentContext] = useState("calendar");

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
					<div className="avatar">이</div>
					<div className="user-info">
						<div className="user-name">이수진</div>
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
					<button className="btn-logout">
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
			</div>
		</div>
	);

	function showPage(context) {
		setCurrentContext(context);
	}

	function switchPlat(parm) {
		setCurrentPlatform(parm);
	}

	function RenderContext({ currentContext, currentPlatform }) {
		switch (currentContext) {
			case "calendar":
				return <TutorCalendarView />;
			case "attendance":
				return <TutorAttendanceView />;
			case "schedule":
				return <TutorScheduleRequestView />;
			case "mypage":
				return <TutorMypageView />;
		}
	}
}
