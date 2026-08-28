import { useState, useEffect, useCallback } from "react";
import { listPlatforms, listMyLessons, listCalendarEventsForPlatforms, EVENT_TYPE_STYLE } from "../../api/common.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(year, month, day) {
	return `${year}-${pad(month)}-${pad(day)}`;
}

export default function TutorCalendarView() {
	const today0 = new Date();
	const [calYear, setCalYear] = useState(today0.getFullYear());
	const [calMonth, setCalMonth] = useState(today0.getMonth() + 1);
	const [selDay, setSelDay] = useState(today0.getDate());
	const [platforms, setPlatforms] = useState([]);
	const [lessons, setLessons] = useState([]);
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		const daysInMonth = new Date(calYear, calMonth, 0).getDate();
		const from = isoDate(calYear, calMonth, 1);
		const to = isoDate(calYear, calMonth, daysInMonth);
		const platformList = await listPlatforms();
		setPlatforms(platformList);
		const [lessonList, eventList] = await Promise.all([
			listMyLessons(from, to),
			listCalendarEventsForPlatforms(platformList, from, to)
		]);
		setLessons(lessonList);
		setEvents(eventList);
		setLoading(false);
	}, [calYear, calMonth]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function calNav(delta) {
		let y = calYear, m = calMonth + delta;
		if (m > 12) { m = 1; y++; }
		if (m < 1) { m = 12; y--; }
		setCalYear(y);
		setCalMonth(m);
		setSelDay(1);
	}

	const platformsById = Object.fromEntries(platforms.map((p) => [p.id, p]));
	const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
	const daysInMonth = new Date(calYear, calMonth, 0).getDate();
	const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();
	const isCurMonth = today0.getFullYear() === calYear && today0.getMonth() + 1 === calMonth;
	const todayDay = isCurMonth ? today0.getDate() : -1;

	const lessonsByDay = {};
	lessons.forEach((l) => {
		const d = Number(l.lessonDate.slice(-2));
		(lessonsByDay[d] = lessonsByDay[d] || []).push(l);
	});
	const eventsByDay = {};
	events.forEach((e) => {
		const d = Number(e.eventDate.slice(-2));
		(eventsByDay[d] = eventsByDay[d] || []).push(e);
	});

	const selDow = new Date(calYear, calMonth - 1, selDay).getDay();
	const selLessons = lessonsByDay[selDay] || [];
	const selEvents = eventsByDay[selDay] || [];
	const selIsToday = isCurMonth && selDay === todayDay;

	const todayLessonCount = lessonsByDay[todayDay]?.length || 0;
	const monthTotal = lessons.reduce((sum, l) => sum + l.totalAttendance, 0);
	const monthPresent = lessons.reduce((sum, l) => sum + l.presentCount, 0);
	const monthRate = monthTotal === 0 ? 0 : Math.round((monthPresent / monthTotal) * 100);

	return (
		<div id="tutor-calendar" className="page active">
			<div className="page-header">
				<div className="page-label">Tutor / Calendar</div>
				<div className="page-title">내 캘린더</div>
				<div className="page-subtitle">내 레슨 일정과 플랫폼 공지를 확인하세요</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
				<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>내 소속</span>
				{platforms.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>소속된 플랫폼이 없습니다</span>}
				{platforms.map((p) => (
					<div key={p.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: p.colorHex }}>
						<span style={{ display: "inline-block", width: "10px", height: "10px", background: p.colorHex, borderRadius: "2px" }}></span>
						{p.name}
					</div>
				))}
			</div>

			<div className="today-summary">
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : todayLessonCount}</div>
					<div className="summary-key">오늘 레슨</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--green)" }}>{loading ? "-" : lessons.length}</div>
					<div className="summary-key">이번 달 레슨</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : `${monthRate}%`}</div>
					<div className="summary-key">이번 달 출결률</div>
				</div>
			</div>

			<div className="tutor-cal-layout">
				<div className="card">
					<div className="cal-header">
						<span className="cal-month">{calYear}년 {calMonth}월</span>
						<div className="cal-nav">
							<button className="cal-btn" onClick={() => calNav(-1)}>‹</button>
							<button className="cal-btn" onClick={() => calNav(1)}>›</button>
						</div>
					</div>
					<div className="cal-days-header">
						<div className="cal-day-label" style={{ color: "#f87171" }}>일</div>
						<div className="cal-day-label">월</div>
						<div className="cal-day-label">화</div>
						<div className="cal-day-label">수</div>
						<div className="cal-day-label">목</div>
						<div className="cal-day-label">금</div>
						<div className="cal-day-label" style={{ color: "#7c9ef7" }}>토</div>
					</div>
					<div className="cal-days">
						{Array.from({ length: firstDow }, (_, i) => (
							<div className="cal-cell dim" key={`prev${i}`}>{daysInPrev - firstDow + 1 + i}</div>
						))}
						{Array.from({ length: daysInMonth }, (_, i) => {
							const d = i + 1;
							const dayLessons = lessonsByDay[d] || [];
							const dayEvents = eventsByDay[d] || [];
							const colors = [
								...new Set(dayLessons.map((l) => platformsById[l.platformId]?.colorHex || "#888")),
								...new Set(dayEvents.map((e) => EVENT_TYPE_STYLE[e.type]?.color || "#888"))
							];
							let cls = "cal-cell";
							if (d === selDay) cls += " selected";
							else if (d === todayDay) cls += " today";
							return (
								<div className={cls} key={d} onClick={() => setSelDay(d)}>
									<div style={{ fontSize: "11px", fontWeight: 500, lineHeight: 1 }}>{d}</div>
									{colors.map((c) => <div className="event-bar" style={{ background: c }} key={c}></div>)}
								</div>
							);
						})}
					</div>
				</div>

				<div className="card">
					<div className="day-detail" style={{ margin: 0, padding: 0, border: "none" }}>
						<div className="day-detail-header">
							<div className="day-detail-title">{calMonth}월 {selDay}일의 일정</div>
							<div className="day-detail-date">{WEEKDAYS[selDow]}요일{selIsToday ? " · 오늘" : ""}</div>
						</div>
						<div className="day-events">
							{selLessons.length === 0 && selEvents.length === 0 ? (
								<div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>이 날의 일정이 없습니다</div>
							) : (
								<>
									{selLessons.map((l) => (
										<div key={l.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
											<div style={{ width: "3px", height: "36px", borderRadius: "2px", background: platformsById[l.platformId]?.colorHex || "#888", flexShrink: 0 }}></div>
											<div style={{ flex: 1 }}>
												<div style={{ fontSize: "13px", fontWeight: 600 }}>{l.programName}</div>
												<div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
													{platformsById[l.platformId]?.name} · {l.endedAt ? "완료" : l.startedAt ? "진행 중" : "예정"}
												</div>
											</div>
										</div>
									))}
									{selEvents.map((e) => {
										const style = EVENT_TYPE_STYLE[e.type] || { color: "#888", label: e.type };
										return (
											<div key={e.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
												<div style={{ width: "3px", height: "36px", borderRadius: "2px", background: style.color, flexShrink: 0 }}></div>
												<div style={{ flex: 1 }}>
													<div style={{ fontSize: "13px", fontWeight: 600 }}>{e.title}</div>
													<div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{style.label}{e.description ? ` · ${e.description}` : ""}</div>
												</div>
											</div>
										);
									})}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
