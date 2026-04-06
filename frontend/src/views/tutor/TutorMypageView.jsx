export default function TutorMypageView() {
	return (
		<div id="tutor-mypage" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / My Page</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">내 계정 정보와 소속 플랫폼 현황을 확인하세요</div>
			</div>

			<div className="mypage-hero" style={{ marginBottom: "24px" }}>
				<div
					className="hero-avatar"
					style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)" }}
				>
					이
				</div>
				<div className="hero-identity">
					<div className="hero-name">이수진 트레이너</div>
					<div className="hero-email">
						<a
							href="/cdn-cgi/l/email-protection"
							className="__cf_email__"
							data-cfemail="9cefe9f6f5f2b2f0f9f9dceef9eff9eeeaf9f4e9feb2fff3f1"
						>
							[email&#160;protected]
						</a>
					</div>
				</div>
				<div className="hero-divider"></div>
				<div className="hero-stats">
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent2)" }}>
							2
						</div>
						<div className="hstat-key">소속 플랫폼</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent2)" }}>
							24
						</div>
						<div className="hstat-key">담당 수강생</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent2)" }}>
							142
						</div>
						<div className="hstat-key">이번 달 레슨</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--green)" }}>
							91%
						</div>
						<div className="hstat-key">출결률</div>
					</div>
				</div>
				<button className="btn btn-ghost hero-edit btn-sm">✏️ 정보 수정</button>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
				<div className="card">
					<div className="card-title">소속 플랫폼</div>

					<div className="platform-item">
						<div className="plat-emoji" style={{ background: "rgba(124,106,247,0.1)" }}>
							🤸
						</div>
						<div className="plat-detail">
							<div className="plat-name">스튜디오 필라테스 강남</div>
							<span
								className="plat-tag"
								style={{ background: "rgba(124,106,247,0.15)", color: "#7c6af7" }}
							>
								필라테스
							</span>
							<div className="plat-dates">담당: 그룹반 A · 그룹반 B · 1:1 개인레슨</div>
							<div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
								<span style={{ fontSize: "11px", color: "var(--text-sub)" }}>담당 수강생</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "13px",
										color: "#7c6af7",
										fontWeight: 600
									}}
								>
									18명
								</span>
							</div>
						</div>
						<span className="plat-status ps-active">재직 중</span>
					</div>

					<div className="platform-item">
						<div className="plat-emoji" style={{ background: "rgba(79,209,197,0.1)" }}>
							🧘
						</div>
						<div className="plat-detail">
							<div className="plat-name">요가라운지 홍대</div>
							<span
								className="plat-tag"
								style={{ background: "rgba(79,209,197,0.15)", color: "#4fd1c5" }}
							>
								요가
							</span>
							<div className="plat-dates">담당: 요가 기초반 · 요가 심화반</div>
							<div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
								<span style={{ fontSize: "11px", color: "var(--text-sub)" }}>담당 수강생</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "13px",
										color: "#4fd1c5",
										fontWeight: 600
									}}
								>
									6명
								</span>
							</div>
						</div>
						<span className="plat-status ps-active">재직 중</span>
					</div>
				</div>

				<div className="card">
					<div className="card-title">이번 달 레슨 현황</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "8px",
							marginBottom: "18px"
						}}
					>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "14px",
								textAlign: "center"
							}}
						>
							<div
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "22px",
									fontWeight: 500,
									color: "#7c6af7"
								}}
							>
								108
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>
								필라테스 레슨
							</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "14px",
								textAlign: "center"
							}}
						>
							<div
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "22px",
									fontWeight: 500,
									color: "#4fd1c5"
								}}
							>
								34
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>
								요가 레슨
							</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "14px",
								textAlign: "center"
							}}
						>
							<div
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "22px",
									fontWeight: 500,
									color: "var(--green)"
								}}
							>
								91%
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>
								평균 출결률
							</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "14px",
								textAlign: "center"
							}}
						>
							<div
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "22px",
									fontWeight: 500,
									color: "var(--accent3)"
								}}
							>
								3
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "3px" }}>
								변경 요청
							</div>
						</div>
					</div>
					<div
						style={{
							fontSize: "11px",
							color: "var(--text-sub)",
							marginBottom: "10px",
							letterSpacing: "1px",
							textTransform: "uppercase"
						}}
					>
						주차별 레슨 수
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<span style={{ fontSize: "11px", color: "var(--text-dim)", width: "24px" }}>1주</span>
							<div
								style={{
									flex: 1,
									height: "5px",
									background: "var(--border)",
									borderRadius: "3px",
									overflow: "hidden"
								}}
							>
								<div
									style={{
										width: "80%",
										height: "100%",
										background: "#7c6af7",
										borderRadius: "3px"
									}}
								></div>
							</div>
							<span
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "11px",
									color: "var(--text-sub)",
									width: "28px",
									textAlign: "right"
								}}
							>
								32
							</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<span style={{ fontSize: "11px", color: "var(--text-dim)", width: "24px" }}>2주</span>
							<div
								style={{
									flex: 1,
									height: "5px",
									background: "var(--border)",
									borderRadius: "3px",
									overflow: "hidden"
								}}
							>
								<div
									style={{
										width: "90%",
										height: "100%",
										background: "#7c6af7",
										borderRadius: "3px"
									}}
								></div>
							</div>
							<span
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "11px",
									color: "var(--text-sub)",
									width: "28px",
									textAlign: "right"
								}}
							>
								36
							</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<span style={{ fontSize: "11px", color: "var(--text-dim)", width: "24px" }}>3주</span>
							<div
								style={{
									flex: 1,
									height: "5px",
									background: "var(--border)",
									borderRadius: "3px",
									overflow: "hidden"
								}}
							>
								<div
									style={{
										width: "75%",
										height: "100%",
										background: "#7c6af7",
										borderRadius: "3px"
									}}
								></div>
							</div>
							<span
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "11px",
									color: "var(--text-sub)",
									width: "28px",
									textAlign: "right"
								}}
							>
								30
							</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<span style={{ fontSize: "11px", color: "var(--text-dim)", width: "24px" }}>4주</span>
							<div
								style={{
									flex: 1,
									height: "5px",
									background: "var(--border)",
									borderRadius: "3px",
									overflow: "hidden"
								}}
							>
								<div
									style={{
										width: "40%",
										height: "100%",
										background: "rgba(124,106,247,0.35)",
										borderRadius: "3px"
									}}
								></div>
							</div>
							<span
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "11px",
									color: "var(--text-dim)",
									width: "28px",
									textAlign: "right"
								}}
							>
								진행
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
