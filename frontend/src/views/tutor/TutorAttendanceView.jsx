import { useState, useEffect, useCallback } from "react";
import {
	listMySlots, listMyLessons, listLessonAttendance, recordAttendance, startLesson, endLesson,
	listMembers, listPlatforms
} from "../../api/common.js";

const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };
const JS_DAY_TO_KEY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const STATUS_LABEL = { PRESENT: "출석", LATE: "지각", ABSENT: "결석", EXCUSED: "사유결석" };

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TutorAttendanceView({ platformId }) {
	const today = new Date();
	const todayIso = isoDate(today);
	const todayKey = JS_DAY_TO_KEY[today.getDay()];

	const [slots, setSlots] = useState([]);
	const [platformsById, setPlatformsById] = useState({});
	const [todayLessons, setTodayLessons] = useState([]);
	const [attendanceByLesson, setAttendanceByLesson] = useState({});
	const [membersByPlatform, setMembersByPlatform] = useState({});
	const [monthLessons, setMonthLessons] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
		const monthEnd = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
		const [mySlots, platforms, todaysLessons, monthly] = await Promise.all([
			listMySlots(),
			listPlatforms(),
			listMyLessons(todayIso, todayIso),
			listMyLessons(monthStart, monthEnd)
		]);
		const myTodaysLessons = todaysLessons.filter((l) => l.platformId === platformId);
		setSlots(mySlots.filter((s) => s.platformId === platformId));
		setPlatformsById(Object.fromEntries(platforms.map((p) => [p.id, p.name])));
		setTodayLessons(myTodaysLessons);
		setMonthLessons(monthly.filter((l) => l.platformId === platformId));

		const attendanceEntries = await Promise.all(myTodaysLessons.map((l) => listLessonAttendance(l.id)));
		setAttendanceByLesson(Object.fromEntries(myTodaysLessons.map((l, i) => [l.id, attendanceEntries[i]])));

		const platformIds = [...new Set(myTodaysLessons.map((l) => l.platformId))];
		const memberLists = await Promise.all(platformIds.map((id) => listMembers(id)));
		const membersMap = {};
		platformIds.forEach((id, i) => {
			const seen = new Set();
			membersMap[id] = memberLists[i].filter((m) => (seen.has(m.userId) ? false : seen.add(m.userId)));
		});
		setMembersByPlatform(membersMap);

		setLoading(false);
	}, [todayIso, platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function mark(lessonId, userId, status) {
		await recordAttendance(lessonId, userId, status);
		setAttendanceByLesson((prev) => ({ ...prev, [lessonId]: [...prev[lessonId], { userId, status }] }));
	}
	async function begin(lessonId) {
		await startLesson(lessonId);
		await refresh();
	}
	async function finish(lessonId) {
		await endLesson(lessonId);
		await refresh();
	}

	const slotsByDay = {};
	slots.forEach((s) => { (slotsByDay[s.dayOfWeek] = slotsByDay[s.dayOfWeek] || []).push(s); });

	const allAttendance = Object.values(attendanceByLesson).flat();
	const countByStatus = (status) => allAttendance.filter((a) => a.status === status).length;

	const monthTotal = monthLessons.reduce((sum, l) => sum + l.totalAttendance, 0);
	const monthPresent = monthLessons.reduce((sum, l) => sum + l.presentCount, 0);
	const monthRate = monthTotal === 0 ? 0 : Math.round((monthPresent / monthTotal) * 100);

	return (
		<div id="tutor-attend" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / Attendance</div>
				<div className="page-title">출석 관리</div>
				<div className="page-subtitle">고정된 주간 수업 계획을 확인하고 오늘 출석을 처리하세요</div>
			</div>

			<div className="attend-layout">
				<div>
					<div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
						<div style={{ overflowX: "auto" }}>
							<table className="attend-table" style={{ tableLayout: "fixed", width: "100%" }}>
								<thead>
									<tr>
										{DAY_KEYS.map((key) => (
											<th key={key} style={{ color: key === todayKey ? "var(--tutor)" : undefined }}>
												{DAY_LABELS[key]}{key === todayKey ? " (오늘)" : ""}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									<tr>
										{DAY_KEYS.map((key) => (
											<td key={key} style={{ verticalAlign: "top", padding: "8px", background: key === todayKey ? "rgba(var(--tutor-rgb),.06)" : undefined }}>
												{loading ? (
													<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>-</span>
												) : (slotsByDay[key] || []).length === 0 ? (
													<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>수업 없음</span>
												) : (
													slotsByDay[key].map((s) => (
														<div key={s.id} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "8px", marginBottom: "6px" }}>
															<div style={{ fontSize: "12px", fontWeight: 700 }}>{s.programName}</div>
															<div style={{ fontSize: "10px", color: "var(--text-sub)", marginTop: "2px" }}>{platformsById[s.platformId]}</div>
															<div style={{ fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "var(--tutor)", marginTop: "4px" }}>
																{s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)}
															</div>
														</div>
													))
												)}
											</td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<div className="card-title" style={{ marginBottom: "12px" }}>오늘 출석 처리</div>
					{loading ? (
						<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
					) : todayLessons.length === 0 ? (
						<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>오늘 예정된 수업이 없습니다</div>
					) : (
						todayLessons.map((lesson) => {
							const members = membersByPlatform[lesson.platformId] || [];
							const recorded = attendanceByLesson[lesson.id] || [];
							const recordedByUser = Object.fromEntries(recorded.map((a) => [a.userId, a.status]));
							return (
								<div className="card" key={lesson.id} style={{ padding: 0, overflow: "hidden", marginBottom: "16px" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
										<div>
											<div style={{ fontWeight: 700, fontSize: "14px" }}>{lesson.programName}</div>
											<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{platformsById[lesson.platformId]}</div>
										</div>
										{!lesson.startedAt ? (
											<button className="btn btn-sm" style={{ background: "rgba(var(--green-rgb),.12)", color: "var(--green)", border: "1px solid rgba(var(--green-rgb),.3)" }} onClick={() => begin(lesson.id)}>
												수업 시작
											</button>
										) : !lesson.endedAt ? (
											<button className="btn btn-sm btn-danger" onClick={() => finish(lesson.id)}>수업 종료</button>
										) : (
											<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>종료됨</span>
										)}
									</div>
									<div style={{ overflowX: "auto" }}>
										<table className="attend-table">
											<thead>
												<tr><th>수강생</th><th>연락처</th><th>출결</th></tr>
											</thead>
											<tbody>
												{members.length === 0 ? (
													<tr><td colSpan={3} style={{ textAlign: "center", padding: "16px", color: "var(--text-dim)" }}>등록된 회원이 없습니다</td></tr>
												) : (
													members.map((m) => (
														<tr key={m.userId}>
															<td style={{ fontWeight: 600 }}>{m.name}</td>
															<td style={{ fontSize: "12px", color: "var(--text-sub)" }}>{m.phone || "-"}</td>
															<td>
																{recordedByUser[m.userId] ? (
																	<button className={`atbtn ${recordedByUser[m.userId].toLowerCase()}`}>{STATUS_LABEL[recordedByUser[m.userId]]}</button>
																) : (
																	<div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
																		<button className="atbtn" onClick={() => mark(lesson.id, m.userId, "PRESENT")}>출석</button>
																		<button className="atbtn" onClick={() => mark(lesson.id, m.userId, "LATE")}>지각</button>
																		<button className="atbtn" onClick={() => mark(lesson.id, m.userId, "ABSENT")}>결석</button>
																	</div>
																)}
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>
								</div>
							);
						})
					)}
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					<div className="card">
						<div className="card-title">오늘 출결 현황</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>출석</span>
								<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "14px", fontWeight: 500, color: "var(--green)" }}>{countByStatus("PRESENT")}명</span>
							</div>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>지각</span>
								<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "14px", fontWeight: 500, color: "var(--accent3)" }}>{countByStatus("LATE")}명</span>
							</div>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
								<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>결석</span>
								<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "14px", fontWeight: 500, color: "var(--red)" }}>{countByStatus("ABSENT")}명</span>
							</div>
						</div>
					</div>
					<div className="card">
						<div className="card-title">이번 달 출결률</div>
						<div style={{ textAlign: "center", padding: "14px 0" }}>
							<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "36px", fontWeight: 500, color: "var(--accent2)" }}>
								{loading ? "-" : monthRate}<span style={{ fontSize: "18px", color: "var(--text-sub)" }}>%</span>
							</div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px", letterSpacing: "1px" }}>ATTENDANCE RATE</div>
						</div>
						<div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
							<div style={{ width: `${monthRate}%`, height: "100%", background: "var(--accent2)", borderRadius: "3px" }}></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
