export default function TutorCalendarView() {
	return (
		<div id="admin-calendar" className="page active">
			<div className="page-header">
				<div className="page-label">Admin / Calendar</div>
				<div className="page-title">내 캘린더</div>
				<div className="page-subtitle">오늘의 레슨 일정과 수강생 현황을 확인하세요</div>
			</div>

			{/* 소속 안내 */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "10px",
					marginBottom: "20px",
					flexWrap: "wrap",
					padding: "10px 14px",
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: "10px"
				}}
			>
				<span
					style={{
						fontSize: "10px",
						color: "var(--text-dim)",
						letterSpacing: "1px",
						textTransform: "uppercase",
						fontFamily: "'DM Mono',monospace",
						flexShrink: 0
					}}
				>
					내 소속
				</span>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						fontSize: "12px",
						fontWeight: 600,
						color: "#7c6af7"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "10px",
							background: "#7c6af7",
							borderRadius: "2px"
						}}
					></span>
					스튜디오 필라테스 강남
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						fontSize: "12px",
						fontWeight: 600,
						color: "#4fd1c5"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "10px",
							background: "#4fd1c5",
							borderRadius: "2px"
						}}
					></span>
					요가라운지 홍대
				</div>
			</div>

			{/* 요약 3칸 */}
			<div className="today-summary">
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent2)" }}>
						4
					</div>
					<div className="summary-key">오늘 레슨</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--green)" }}>
						18
					</div>
					<div className="summary-key">오늘 수강생</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent3)" }}>
						2
					</div>
					<div className="summary-key">미출석 확인</div>
				</div>
			</div>

			{/* 캘린더 + 타임라인 */}
			<div className="tutor-cal-layout">
				{/* 달력 */}
				<div className="card">
					<div className="cal-header">
						<span className="cal-month">2026년 2월</span>
						<div className="cal-nav">
							<button className="cal-btn">‹</button>
							<button className="cal-btn">›</button>
						</div>
					</div>
					<div className="cal-days-header">
						<div className="cal-day-label" style={{ color: "#f87171" }}>
							일
						</div>
						<div className="cal-day-label">월</div>
						<div className="cal-day-label">화</div>
						<div className="cal-day-label">수</div>
						<div className="cal-day-label">목</div>
						<div className="cal-day-label">금</div>
						<div className="cal-day-label" style={{ color: "#7c9ef7" }}>
							토
						</div>
					</div>
					<div className="cal-days" id="tutorCalDays"></div>

					<div
						style={{
							display: "flex",
							gap: "12px",
							flexWrap: "wrap",
							marginTop: "14px",
							paddingTop: "12px",
							borderTop: "1px solid var(--border)",
							alignItems: "center"
						}}
					>
						<span
							style={{
								fontSize: "10px",
								color: "var(--text-dim)",
								fontFamily: "'DM Mono',monospace"
							}}
						>
							플랫폼
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "5px",
								fontSize: "11px",
								color: "#7c6af7",
								fontWeight: 600
							}}
						>
							<span
								style={{
									display: "inline-block",
									width: "10px",
									height: "10px",
									background: "#7c6af7",
									borderRadius: "2px"
								}}
							></span>
							스튜디오 필라테스
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "5px",
								fontSize: "11px",
								color: "#4fd1c5",
								fontWeight: 600
							}}
						>
							<span
								style={{
									display: "inline-block",
									width: "10px",
									height: "10px",
									background: "#4fd1c5",
									borderRadius: "2px"
								}}
							></span>
							요가라운지
						</div>
					</div>

					{/* 날짜 클릭 상세 */}
					<div className="day-detail" id="tutorDayDetail" style={{ display: "none" }}>
						<div className="day-detail-header">
							<div className="day-detail-title" id="tutorDayTitle">
								2월 26일의 일정
							</div>
							<div className="day-detail-date" id="tutorDayDate">
								목요일
							</div>
						</div>
						<div className="day-events" id="tutorDayEvents"></div>
					</div>
				</div>

				{/* 오늘 타임라인 */}
				<div className="tutor-cal-right">
					<div className="card" style={{ padding: "20px" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: "18px"
							}}
						>
							<div>
								<div className="card-title" style={{ marginBottom: "1px" }}>
									오늘 전체 일정
								</div>
								<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
									2026년 2월 26일 목요일 · 총 4건
								</div>
							</div>
						</div>

						<div style={{ position: "relative" }}>
							<div
								style={{
									position: "absolute",
									left: "36px",
									top: 0,
									bottom: 0,
									width: "1px",
									background: "var(--border)",
									zIndex: 0
								}}
							></div>

							{/* 09:00 필라테스 그룹 */}
							<div style={{ display: "flex", gap: 0, marginBottom: "14px", position: "relative" }}>
								<div
									style={{
										width: "72px",
										flexShrink: 0,
										paddingTop: "3px",
										textAlign: "right",
										paddingRight: "14px"
									}}
								>
									<span
										style={{
											fontFamily: "'DM Mono',monospace",
											fontSize: "11px",
											color: "var(--text-dim)"
										}}
									>
										09:00
									</span>
								</div>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "#7c6af7",
										flexShrink: 0,
										marginTop: "3px",
										zIndex: 1,
										boxShadow: "0 0 0 3px rgba(124,106,247,0.2)"
									}}
								></div>
								<div
									style={{
										flex: 1,
										background: "rgba(124,106,247,0.08)",
										border: "1px solid rgba(124,106,247,0.22)",
										borderRadius: "10px",
										padding: "10px 14px",
										marginLeft: "10px",
										minWidth: 0
									}}
								>
									<div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "5px" }}>
										그룹반 A — 필라테스 기초
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											flexWrap: "wrap",
											marginBottom: "8px"
										}}
									>
										<span
											className="plat-chip"
											style={{
												background: "rgba(124,106,247,0.15)",
												color: "#7c6af7",
												borderColor: "rgba(124,106,247,0.3)"
											}}
										>
											🤸 스튜디오 필라테스
										</span>
										<span style={{ fontSize: "10px", color: "var(--text-sub)" }}>
											👥 그룹 · 6/8명
										</span>
									</div>
									<button
										className="btn btn-sm"
										style={{
											background: "rgba(74,222,128,0.12)",
											color: "var(--green)",
											border: "1px solid rgba(74,222,128,0.3)"
										}}
									>
										출석 처리
									</button>
								</div>
							</div>

							{/* 10:00 필라테스 개인 */}
							<div style={{ display: "flex", gap: 0, marginBottom: "14px", position: "relative" }}>
								<div
									style={{
										width: "72px",
										flexShrink: 0,
										paddingTop: "3px",
										textAlign: "right",
										paddingRight: "14px"
									}}
								>
									<span
										style={{
											fontFamily: "'DM Mono',monospace",
											fontSize: "11px",
											color: "var(--text-dim)"
										}}
									>
										10:00
									</span>
								</div>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "#7c6af7",
										flexShrink: 0,
										marginTop: "3px",
										zIndex: 1,
										boxShadow: "0 0 0 3px rgba(124,106,247,0.2)"
									}}
								></div>
								<div
									style={{
										flex: 1,
										background: "rgba(124,106,247,0.05)",
										border: "1px solid rgba(124,106,247,0.18)",
										borderRadius: "10px",
										padding: "10px 14px",
										marginLeft: "10px",
										minWidth: 0
									}}
								>
									<div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "5px" }}>
										홍길동 — 1:1 개인 레슨
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											flexWrap: "wrap",
											marginBottom: "8px"
										}}
									>
										<span
											className="plat-chip"
											style={{
												background: "rgba(124,106,247,0.15)",
												color: "#7c6af7",
												borderColor: "rgba(124,106,247,0.3)"
											}}
										>
											🤸 스튜디오 필라테스
										</span>
										<span style={{ fontSize: "10px", color: "var(--text-sub)" }}>
											👤 개인 · 50분
										</span>
									</div>
									<div style={{ display: "flex", gap: "6px" }}>
										<button
											className="btn btn-sm"
											style={{
												background: "rgba(74,222,128,0.12)",
												color: "var(--green)",
												border: "1px solid rgba(74,222,128,0.3)"
											}}
										>
											출석
										</button>
										<button className="btn btn-sm btn-danger" onClick="openRequestModal()">
											변경 요청
										</button>
									</div>
								</div>
							</div>

							{/* 이동 */}
							<div style={{ display: "flex", gap: 0, marginBottom: "14px", position: "relative" }}>
								<div style={{ width: "72px", flexShrink: 0 }}></div>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "50%",
										background: "var(--surface2)",
										border: "1px solid var(--border)",
										flexShrink: 0,
										marginTop: "3px",
										zIndex: 1
									}}
								></div>
								<div
									style={{
										flex: 1,
										padding: "7px 12px",
										marginLeft: "10px",
										background: "var(--surface2)",
										borderRadius: "8px",
										border: "1px dashed var(--border)",
										minWidth: 0
									}}
								>
									<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
										🚗 스튜디오 필라테스 → 요가라운지 이동
									</span>
								</div>
							</div>

							{/* 14:00 요가 그룹 */}
							<div style={{ display: "flex", gap: 0, marginBottom: "14px", position: "relative" }}>
								<div
									style={{
										width: "72px",
										flexShrink: 0,
										paddingTop: "3px",
										textAlign: "right",
										paddingRight: "14px"
									}}
								>
									<span
										style={{
											fontFamily: "'DM Mono',monospace",
											fontSize: "11px",
											color: "var(--text-dim)"
										}}
									>
										14:00
									</span>
								</div>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "#4fd1c5",
										flexShrink: 0,
										marginTop: "3px",
										zIndex: 1,
										boxShadow: "0 0 0 3px rgba(79,209,197,0.2)"
									}}
								></div>
								<div
									style={{
										flex: 1,
										background: "rgba(79,209,197,0.08)",
										border: "1px solid rgba(79,209,197,0.22)",
										borderRadius: "10px",
										padding: "10px 14px",
										marginLeft: "10px",
										minWidth: 0
									}}
								>
									<div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "5px" }}>
										그룹반 B — 요가 기초
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											flexWrap: "wrap",
											marginBottom: "8px"
										}}
									>
										<span
											className="plat-chip"
											style={{
												background: "rgba(79,209,197,0.15)",
												color: "#4fd1c5",
												borderColor: "rgba(79,209,197,0.3)"
											}}
										>
											🧘 요가라운지 홍대
										</span>
										<span style={{ fontSize: "10px", color: "var(--text-sub)" }}>
											👥 그룹 · 8/8명
										</span>
									</div>
									<button
										className="btn btn-sm"
										style={{
											background: "rgba(74,222,128,0.12)",
											color: "var(--green)",
											border: "1px solid rgba(74,222,128,0.3)"
										}}
									>
										출석 처리
									</button>
								</div>
							</div>

							{/* 16:00 필라테스 개인 */}
							<div style={{ display: "flex", gap: 0, position: "relative" }}>
								<div
									style={{
										width: "72px",
										flexShrink: 0,
										paddingTop: "3px",
										textAlign: "right",
										paddingRight: "14px"
									}}
								>
									<span
										style={{
											fontFamily: "'DM Mono',monospace",
											fontSize: "11px",
											color: "var(--text-dim)"
										}}
									>
										16:00
									</span>
								</div>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "#7c6af7",
										flexShrink: 0,
										marginTop: "3px",
										zIndex: 1,
										boxShadow: "0 0 0 3px rgba(124,106,247,0.2)"
									}}
								></div>
								<div
									style={{
										flex: 1,
										background: "rgba(124,106,247,0.05)",
										border: "1px solid rgba(124,106,247,0.18)",
										borderRadius: "10px",
										padding: "10px 14px",
										marginLeft: "10px",
										minWidth: 0
									}}
								>
									<div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "5px" }}>
										김민지 — 1:1 개인 레슨
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											flexWrap: "wrap",
											marginBottom: "8px"
										}}
									>
										<span
											className="plat-chip"
											style={{
												background: "rgba(124,106,247,0.15)",
												color: "#7c6af7",
												borderColor: "rgba(124,106,247,0.3)"
											}}
										>
											🤸 스튜디오 필라테스
										</span>
										<span style={{ fontSize: "10px", color: "var(--text-sub)" }}>
											👤 개인 · 50분
										</span>
									</div>
									<div style={{ display: "flex", gap: "6px" }}>
										<button
											className="btn btn-sm"
											style={{
												background: "rgba(74,222,128,0.12)",
												color: "var(--green)",
												border: "1px solid rgba(74,222,128,0.3)"
											}}
										>
											출석
										</button>
										<button className="btn btn-sm btn-danger" onClick="openRequestModal()">
											변경 요청
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	function openRequestModal() {
		window.showAdminPage("admin-request", document.querySelectorAll("#admin-sidebar .nav-item")[2]);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}
}
