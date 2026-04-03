import { useEffect, useState } from "react";

export default function TutorView() {
	return (
		<div className="app" id="tutor-app">
			<button className="hamburger" onClick="toggleSidebar('tutor-sidebar','tutor-overlay')">
				☰
			</button>
			<div
				className="sidebar-overlay"
				id="tutor-overlay"
				onClick="toggleSidebar('tutor-sidebar','tutor-overlay')"
			></div>

			<nav className="sidebar tutor-sidebar" id="tutor-sidebar">
				<div className="logo">
					<div className="logo-texts">
						<div className="logo-mark" style={{ color: "var(--accent2)" }}>
							Ttutor
						</div>
						<div className="logo-name">ReserveHub</div>
					</div>
					<button className="collapse-btn" onClick="collapseSidebar('tutor-sidebar')">
						◀
					</button>
				</div>
				<div className="nav">
					<button className="nav-item active" onClick="showTtutorPage('tutor-calendar',this)">
						<span className="nav-icon">📅</span>
						<span className="nav-label">내 캘린더</span>
					</button>
					<button className="nav-item" onClick="showTtutorPage('tutor-attend',this)">
						<span className="nav-icon">✅</span>
						<span className="nav-label">출석 관리</span>
					</button>
					<button className="nav-item" onClick="showTtutorPage('tutor-request',this)">
						<span className="nav-icon">📋</span>
						<span className="nav-label">일정 변경 요청</span>
					</button>
					<button className="nav-item" onClick="showTtutorPage('tutor-mypage',this)">
						<span className="nav-icon">👤</span>
						<span className="nav-label">내 정보</span>
					</button>
				</div>
				<div className="sidebar-footer">
					<div className="user-pill">
						<div
							className="avatar"
							style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)" }}
						>
							이
						</div>
						<div className="user-info">
							<div className="user-name">이수진 트레이너</div>
							<div className="user-role" style={{ color: "var(--accent2)" }}>
								일반관리자
							</div>
						</div>
					</div>
				</div>
			</nav>

			<main className="main" id="tutor-main"></main>
		</div>
	);
}
