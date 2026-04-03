export default function SubsupStudyHistoryView() {
	return (
		<div className="page" id="super-history">
			{/* ══════════════ 수업 이력 ══════════════ */}
			<div className="page-header">
				<div className="page-label">HISTORY</div>
				<div className="page-title">수업 이력</div>
				<div className="page-subtitle">강사별·기간별 수업 현황을 분석하세요</div>
			</div>
			{/* 필터 */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "10px",
					flexWrap: "wrap",
					marginBottom: "20px"
				}}
			>
				<div className="form-field" style={{ margin: "0" }}>
					<select
						id="histYear"
						onChange="histRender()"
						style={{
							padding: "7px 12px",
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "var(--rs)",
							color: "var(--text)",
							fontSize: "13px",
							outline: "none"
						}}
					>
						<option value="2026">2026년</option>
						<option value="2025">2025년</option>
						<option value="2024">2024년</option>
					</select>
				</div>
				<div className="form-field" style={{ margin: "0" }}>
					<select
						id="histMonth"
						onChange="histRender()"
						style={{
							padding: "7px 12px",
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "var(--rs)",
							color: "var(--text)",
							fontSize: "13px",
							outline: "none"
						}}
					>
						<option value="0">전체 월</option>
						<option value="1">1월</option>
						<option value="2">2월</option>
						<option value="3" selected>
							3월
						</option>
						<option value="4">4월</option>
						<option value="5">5월</option>
						<option value="6">6월</option>
						<option value="7">7월</option>
						<option value="8">8월</option>
						<option value="9">9월</option>
						<option value="10">10월</option>
						<option value="11">11월</option>
						<option value="12">12월</option>
					</select>
				</div>
				<div className="form-field" style={{ margin: "0" }}>
					<select
						id="histInstructor"
						onChange="histRender()"
						style={{
							padding: "7px 12px",
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "var(--rs)",
							color: "var(--text)",
							fontSize: "13px",
							outline: "none"
						}}
					>
						<option value="all">전체 강사</option>
						<option value="이수진">이수진 트레이너</option>
						<option value="김현우">김현우 트레이너</option>
					</select>
				</div>
				<div className="form-field" style={{ margin: "0" }}>
					<select
						id="histType"
						onChange="histRender()"
						style={{
							padding: "7px 12px",
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "var(--rs)",
							color: "var(--text)",
							fontSize: "13px",
							outline: "none"
						}}
					>
						<option value="all">전체 유형</option>
						<option value="group">그룹 레슨</option>
						<option value="private">개인 레슨</option>
					</select>
				</div>
			</div>
			{/* KPI */}
			<div className="hist-kpi">
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--accent2)" }} id="histTotal">
						0
					</div>
					<div className="kpi-key">총 수업</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--accent)" }} id="histGroup">
						0
					</div>
					<div className="kpi-key">그룹 레슨</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--accent3)" }} id="histPrivate">
						0
					</div>
					<div className="kpi-key">개인 레슨</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--green)" }} id="histStudents">
						0
					</div>
					<div className="kpi-key">수강 인원</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--green)" }} id="histAttend">
						0%
					</div>
					<div className="kpi-key">출결률</div>
				</div>
			</div>
			{/* 강사 바 차트 + 테이블 */}
			<div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "18px" }}>
				<div className="card">
					<div className="card-title">강사별 수업 수</div>
					<div
						id="histBars"
						style={{ display: "flex", flexDirection: "column", gap: "14px" }}
					></div>
				</div>
				<div className="card" style={{ padding: "0", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
								<tr>
									<th>날짜</th>
									<th>강사</th>
									<th>유형</th>
									<th>프로그램</th>
									<th>정원</th>
									<th>출석</th>
									<th>출결률</th>
								</tr>
							</thead>
							<tbody id="histTbody"></tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
