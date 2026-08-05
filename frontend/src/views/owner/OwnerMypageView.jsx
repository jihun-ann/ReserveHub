export default function OwnerMypageView(){
	return (
		<div id="owner-mypage" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / My Page</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">오너 계정 정보를 확인하세요</div>
			</div>

			<div className="mypage-hero" style={{ marginBottom: "24px" }}>
				<div className="hero-avatar" style={{ background: "linear-gradient(135deg,#f6ad55,#ed8936)" }}>
					박
				</div>
				<div className="hero-identity">
					<div className="hero-name">박지훈 원장</div>
					<div className="hero-email">park.jihoon@reservehub.kr</div>
				</div>
				<div className="hero-divider"></div>
				<div className="hero-stats">
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "#f6ad55" }}>
							3
						</div>
						<div className="hstat-key">관리 플랫폼</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "#f6ad55" }}>
							284
						</div>
						<div className="hstat-key">전체 회원</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "#f6ad55" }}>
							9
						</div>
						<div className="hstat-key">일반관리자</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--green)" }}>
							18.4만
						</div>
						<div className="hstat-key">이번 달 매출</div>
					</div>
				</div>
				<button className="btn btn-ghost hero-edit btn-sm">✏️ 정보 수정</button>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
				<div className="card">
					<div className="card-title">관리 플랫폼</div>
					<div className="platform-item">
						<div className="plat-emoji">🤸</div>
						<div className="plat-detail">
							<div className="plat-name">스튜디오 필라테스 강남</div>
							<span className="plat-tag" style={{ background: "rgba(124,106,247,0.15)", color: "#7c6af7" }}>
								필라테스
							</span>
							<div className="plat-dates">회원 142명 · 강사 4명</div>
						</div>
						<span className="plat-status ps-active">운영 중</span>
					</div>
					<div className="platform-item">
						<div className="plat-emoji">🧘</div>
						<div className="plat-detail">
							<div className="plat-name">요가라운지 홍대</div>
							<span className="plat-tag" style={{ background: "rgba(79,209,197,0.15)", color: "#4fd1c5" }}>
								요가
							</span>
							<div className="plat-dates">회원 86명 · 강사 2명</div>
						</div>
						<span className="plat-status ps-active">운영 중</span>
					</div>
					<div className="platform-item">
						<div className="plat-emoji">🎵</div>
						<div className="plat-detail">
							<div className="plat-name">뮤직하우스 홍대</div>
							<span className="plat-tag" style={{ background: "rgba(246,173,85,0.15)", color: "#f6ad55" }}>
								음악
							</span>
							<div className="plat-dates">회원 56명 · 강사 3명</div>
						</div>
						<span className="plat-status ps-active">운영 중</span>
					</div>
				</div>
				<div className="card">
					<div className="card-title">전체 매출 현황</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
						<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center" }}>
							<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 500, color: "#4fd1c5" }}>
								18.4만
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>이번 달</div>
						</div>
						<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center" }}>
							<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 500, color: "#7c6af7" }}>
								16.9만
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>지난 달</div>
						</div>
						<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center" }}>
							<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 500, color: "var(--green)" }}>
								↑9%
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>성장률</div>
						</div>
						<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center" }}>
							<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 500, color: "#f6ad55" }}>
								196만
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>연간 누적</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
