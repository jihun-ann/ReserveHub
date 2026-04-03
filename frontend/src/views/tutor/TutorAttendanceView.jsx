export default function TutorAttendanceView() {
	return (
		<div id="tutor-attend" className="page">
			<div className="page-header">
				<div className="page-label">Ttutor / Attendance</div>
				<div className="page-title">출석 관리</div>
				<div className="page-subtitle">수강생 출석을 확인하고 처리하세요</div>
			</div>

			<div className="attend-layout">
				<div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "10px",
							marginBottom: "18px",
							flexWrap: "wrap"
						}}
					>
						<span style={{ fontSize: "15px", fontWeight: 700, flex: 1 }}>
							2026년 2월 26일 목요일
						</span>
						<button className="filter-chip active">전체</button>
						<button className="filter-chip">그룹반 A</button>
						<button className="filter-chip">그룹반 B</button>
						<button className="filter-chip">개인레슨</button>
					</div>

					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ overflowX: "auto" }}>
							<table className="attend-table">
								<thead>
									<tr>
										<th>수강생</th>
										<th>프로그램</th>
										<th>플랫폼</th>
										<th>시간</th>
										<th>출결</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<div style={{ fontWeight: 600 }}>홍길동</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
												010-1234-5678
											</div>
										</td>
										<td>1:1 개인 레슨</td>
										<td>
											<span
												className="plat-chip"
												style={{
													background: "rgba(124,106,247,0.12)",
													color: "#7c6af7",
													borderColor: "rgba(124,106,247,0.3)"
												}}
											>
												🤸 필라테스
											</span>
										</td>
										<td>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												10:00
											</span>
										</td>
										<td>
											<div style={{ display: "flex", gap: "4px" }}>
												<button className="atbtn present" onClick="setAttend(this,'present')">
													출석
												</button>
												<button className="atbtn" onClick="setAttend(this,'late')">
													지각
												</button>
												<button className="atbtn" onClick="setAttend(this,'absent')">
													결석
												</button>
											</div>
										</td>
									</tr>
									<tr>
										<td>
											<div style={{ fontWeight: 600 }}>김민지</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
												010-9876-5432
											</div>
										</td>
										<td>그룹반 A</td>
										<td>
											<span
												className="plat-chip"
												style={{
													background: "rgba(124,106,247,0.12)",
													color: "#7c6af7",
													borderColor: "rgba(124,106,247,0.3)"
												}}
											>
												🤸 필라테스
											</span>
										</td>
										<td>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												09:00
											</span>
										</td>
										<td>
											<div style={{ display: "flex", gap: "4px" }}>
												<button className="atbtn" onClick="setAttend(this,'present')">
													출석
												</button>
												<button className="atbtn late" onClick="setAttend(this,'late')">
													지각
												</button>
												<button className="atbtn" onClick="setAttend(this,'absent')">
													결석
												</button>
											</div>
										</td>
									</tr>
									<tr>
										<td>
											<div style={{ fontWeight: 600 }}>박서준</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
												010-5555-4444
											</div>
										</td>
										<td>그룹반 A</td>
										<td>
											<span
												className="plat-chip"
												style={{
													background: "rgba(124,106,247,0.12)",
													color: "#7c6af7",
													borderColor: "rgba(124,106,247,0.3)"
												}}
											>
												🤸 필라테스
											</span>
										</td>
										<td>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												09:00
											</span>
										</td>
										<td>
											<div style={{ display: "flex", gap: "4px" }}>
												<button className="atbtn" onClick="setAttend(this,'present')">
													출석
												</button>
												<button className="atbtn" onClick="setAttend(this,'late')">
													지각
												</button>
												<button className="atbtn absent" onClick="setAttend(this,'absent')">
													결석
												</button>
											</div>
										</td>
									</tr>
									<tr>
										<td>
											<div style={{ fontWeight: 600 }}>이지은</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
												010-2222-3333
											</div>
										</td>
										<td>그룹반 B</td>
										<td>
											<span
												className="plat-chip"
												style={{
													background: "rgba(79,209,197,0.12)",
													color: "#4fd1c5",
													borderColor: "rgba(79,209,197,0.3)"
												}}
											>
												🧘 요가
											</span>
										</td>
										<td>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												14:00
											</span>
										</td>
										<td>
											<div style={{ display: "flex", gap: "4px" }}>
												<button className="atbtn present" onClick="setAttend(this,'present')">
													출석
												</button>
												<button className="atbtn" onClick="setAttend(this,'late')">
													지각
												</button>
												<button className="atbtn" onClick="setAttend(this,'absent')">
													결석
												</button>
											</div>
										</td>
									</tr>
									<tr>
										<td>
											<div style={{ fontWeight: 600 }}>최유나</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>
												010-7777-8888
											</div>
										</td>
										<td>그룹반 B</td>
										<td>
											<span
												className="plat-chip"
												style={{
													background: "rgba(79,209,197,0.12)",
													color: "#4fd1c5",
													borderColor: "rgba(79,209,197,0.3)"
												}}
											>
												🧘 요가
											</span>
										</td>
										<td>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												14:00
											</span>
										</td>
										<td>
											<div style={{ display: "flex", gap: "4px" }}>
												<button className="atbtn" onClick="setAttend(this,'present')">
													출석
												</button>
												<button className="atbtn" onClick="setAttend(this,'late')">
													지각
												</button>
												<button className="atbtn" onClick="setAttend(this,'absent')">
													결석
												</button>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					<div className="card">
						<div className="card-title">오늘 출결 현황</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "10px 0",
									borderBottom: "1px solid var(--border)"
								}}
							>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>출석</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "14px",
										fontWeight: 500,
										color: "var(--green)"
									}}
								>
									12명
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "10px 0",
									borderBottom: "1px solid var(--border)"
								}}
							>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>지각</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "14px",
										fontWeight: 500,
										color: "var(--accent3)"
									}}
								>
									2명
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "10px 0",
									borderBottom: "1px solid var(--border)"
								}}
							>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>결석</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "14px",
										fontWeight: 500,
										color: "var(--red)"
									}}
								>
									1명
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "10px 0"
								}}
							>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>미처리</span>
								<span
									style={{
										fontFamily: "'DM Mono',monospace",
										fontSize: "14px",
										fontWeight: 500,
										color: "var(--text-sub)"
									}}
								>
									3명
								</span>
							</div>
						</div>
					</div>
					<div className="card">
						<div className="card-title">이번 달 출결률</div>
						<div style={{ textAlign: "center", padding: "14px 0" }}>
							<div
								style={{
									fontFamily: "'DM Mono',monospace",
									fontSize: "36px",
									fontWeight: 500,
									color: "var(--accent2)"
								}}
							>
								91<span style={{ fontSize: "18px", color: "var(--text-sub)" }}>%</span>
							</div>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginTop: "4px",
									letterSpacing: "1px"
								}}
							>
								ATTENDANCE RATE
							</div>
						</div>
						<div
							style={{
								height: "6px",
								background: "var(--border)",
								borderRadius: "3px",
								overflow: "hidden"
							}}
						>
							<div
								style={{
									width: "91%",
									height: "100%",
									background: "var(--accent2)",
									borderRadius: "3px"
								}}
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
