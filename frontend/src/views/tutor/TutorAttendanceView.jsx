import { useEffect, useState } from "react";

export default function TutorAttendanceView() {
	let [currentFilter, setCurrentFilter] = useState("all");

	useEffect(() => {
		window.setAttend = setAttend;
		renderAttendance();
	});

	let SCHEDULE = [
		{
			name: "박서준",
			phone: "010-5555-4444",
			plan: "개인 레슨",
			plan_code: "private",
			platform_name: "스튜디오 필라테스 강남",
			platform_id: "platform1",
			time: "10:00",
			attendance: "present"
		},
		{
			name: "김민지",
			phone: "010-9876-5432",
			plan: "그룹 레슨 A",
			plan_code: "groupA",
			platform_name: "스튜디오 필라테스 강남",
			platform_id: "platform1",
			time: "09:00",
			attendance: "late"
		},
		{
			name: "정하준",
			phone: "010-7777-8888",
			plan: "그룹 레슨 A",
			plan_code: "groupA",
			platform_name: "스튜디오 필라테스 강남",
			platform_id: "platform1",
			time: "09:00",
			attendance: "absent"
		},
		{
			name: "홍길동",
			phone: "010-1234-5678",
			plan: "개인 레슨",
			plan_code: "private",
			platform_name: "요가 라운지",
			platform_id: "platform2",
			time: "11:00",
			attendance: "present"
		},
		{
			name: "최유나",
			phone: "010-2020-3030",
			plan: "그룹 레슨 B",
			plan_code: "groupB",
			platform_name: "요가 라운지",
			platform_id: "platform2",
			time: "10:00",
			attendance: ""
		},
		{
			name: "이지은",
			phone: "010-2222-3333",
			plan: "그룹 레슨 B",
			plan_code: "groupB",
			platform_name: "요가 라운지",
			platform_id: "platform2",
			time: "10:00",
			attendance: ""
		}
	];

	return (
		<div id="tutor-attend" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / Attendance</div>
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
						<button
							className={`filter-chip ${currentFilter === "all" ? "active" : ""}`}
							onClick={() => filterChip("all")}
						>
							전체
						</button>
						<button
							className={`filter-chip ${currentFilter === "groupA" ? "active" : ""}`}
							onClick={() => filterChip("groupA")}
						>
							그룹반 A
						</button>
						<button
							className={`filter-chip ${currentFilter === "groupB" ? "active" : ""}`}
							onClick={() => filterChip("groupB")}
						>
							그룹반 B
						</button>
						<button
							className={`filter-chip ${currentFilter === "private" ? "active" : ""}`}
							onClick={() => filterChip("private")}
						>
							개인레슨
						</button>
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
								<tbody id="attendTbody"></tbody>
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
	function setAttend(idx, status) {
		SCHEDULE[idx].attendance = status;
		renderAttendance();
	}

	function filterChip(cat) {
		setCurrentFilter(cat);
		renderAttendance();
	}

	function renderAttendance() {
		const platformStyles = {
			platform1: {
				background: "rgba(79,209,197,0.12)",
				color: "#4fd1c5",
				borderColor: "rgba(79,209,197,0.3)"
			},
			platform2: {
				background: "rgba(66,133,244,0.12)",
				color: "#4285f4",
				borderColor: "rgba(66,133,244,0.3)"
			},
			platform3: {
				background: "rgba(98,100,167,0.12)",
				color: "#6264a7",
				borderColor: "rgba(98,100,167,0.3)"
			},
			platform4: {
				background: "rgba(88,101,242,0.12)",
				color: "#5865f2",
				borderColor: "rgba(88,101,242,0.3)"
			},
			platform5: {
				background: "rgba(160,174,192,0.12)",
				color: "#a0aec0",
				borderColor: "rgba(160,174,192,0.3)"
			}
		};

		const tbody = document.getElementById("attendTbody");
		if (!tbody) return;
		const filtered = SCHEDULE.filter((m) => {
			return currentFilter === "all" || m.plan_code === currentFilter;
		});
		tbody.innerHTML = filtered
			.map((m) => {
				const realIdx = SCHEDULE.indexOf(m);
				const status = { present: "출석", late: "지각", absent: "결석" };
				const attendStatus =
					m.attendance === ""
						? `<button class="atbtn" onclick="setAttend(${realIdx},'present')">출석</button>
							 <button class="atbtn" onclick="setAttend(${realIdx},'late')">지각</button>
							 <button class="atbtn" onclick="setAttend(${realIdx},'absent')">결석</button>`
						: `<button class="atbtn ${m.attendance}">${status[m.attendance]}</button>`;
				return `<tr>
				<td>
					<div style="font-weight: 600">${m.name}</div>
					<div style="font-size: 11px; color: var(--text-sub)">${m.phone}</div>
				</td>
				<td>${m.plan}</td>
				<td>
					<span class="plat-chip" style="background : ${platformStyles[m.platform_id].background};
																				 color : ${platformStyles[m.platform_id].color};
																				 border-color:${platformStyles[m.platform_id].borderColor}">
						${m.platform_name}
					</span>
				</td>
				<td>
					<span style="font-family: 'DM Mono',monospace; font-size: 12px">
						${m.time}
					</span>
				</td>
				<td>
					<div style="display: flex; gap: 4px; justify-content: center;">
						${attendStatus}
					</div>
				</td>
			</tr>`;
			})
			.join("");
	}
}
