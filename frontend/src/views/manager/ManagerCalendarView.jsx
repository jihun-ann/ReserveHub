import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listCalendarEvents, createCalendarEvent, EVENT_TYPE_STYLE } from "../../api/common.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(year, month, day) {
	return `${year}-${pad(month)}-${pad(day)}`;
}

export default function ManagerCalendarView({ platformId }) {
	const today0 = new Date();
	const [calYear, setCalYear] = useState(today0.getFullYear());
	const [calMonth, setCalMonth] = useState(today0.getMonth() + 1);
	const [selDay, setSelDay] = useState(today0.getDate());
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);

	const [newTitle, setNewTitle] = useState("");
	const [newDate, setNewDate] = useState(isoDate(calYear, calMonth, selDay));
	const [newScope, setNewScope] = useState("PLATFORM");
	const [saveError, setSaveError] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setEvents([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const daysInMonth = new Date(calYear, calMonth, 0).getDate();
		const from = isoDate(calYear, calMonth, 1);
		const to = isoDate(calYear, calMonth, daysInMonth);
		setEvents(await listCalendarEvents(platformId, from, to));
		setLoading(false);
	}, [platformId, calYear, calMonth]);

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

	async function submitEvent() {
		if (!newTitle.trim() || !newDate || !platformId) return;
		setSaveError("");
		try {
			await createCalendarEvent({
				platformId, type: "SHARED", title: newTitle.trim(),
				eventDate: newDate, allDay: true, shareScope: newScope
			});
			setNewTitle("");
			closeModal("shareEventModal");
			await refresh();
		} catch (err) {
			setSaveError(err.message || "이벤트 등록에 실패했습니다.");
		}
	}

	const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
	const daysInMonth = new Date(calYear, calMonth, 0).getDate();
	const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();
	const isCurMonth = today0.getFullYear() === calYear && today0.getMonth() + 1 === calMonth;
	const todayDay = isCurMonth ? today0.getDate() : -1;

	const eventsByDay = {};
	events.forEach((e) => {
		const d = Number(e.eventDate.slice(-2));
		(eventsByDay[d] = eventsByDay[d] || []).push(e);
	});

	const selDow = new Date(calYear, calMonth - 1, selDay).getDay();
	const selEvents = eventsByDay[selDay] || [];
	const selIsToday = isCurMonth && selDay === todayDay;

	function openShareEventModal() {
		setNewDate(isoDate(calYear, calMonth, selDay));
		openModal("shareEventModal");
	}

	return (
		<>
		<div className="page" id="manager-calendar">
			<div className="page-header">
				<div className="page-label">CALENDAR</div>
				<div className="page-title">캘린더</div>
				<div className="page-subtitle">플랫폼 전체 일정을 한눈에 확인하세요</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "10px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "20px" }}>
				<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase" }}>범례</span>
				{Object.entries(EVENT_TYPE_STYLE).map(([key, s]) => (
					<div key={key} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", color: s.color }}>
						<span style={{ display: "inline-block", width: "10px", height: "4px", background: s.color, borderRadius: "2px" }}></span>
						{s.label}
					</div>
				))}
				<button className="btn btn-primary btn-sm" style={{ marginLeft: "auto", background: "var(--manager)", color: "#fff" }} onClick={openShareEventModal}>
					+ 공유 이벤트 등록
				</button>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>
				<div className="card">
					<div className="cal-nav-row">
						<span className="cal-month-lbl">{calYear}년 {calMonth}월</span>
						<div className="cal-nav-btns">
							<button className="cal-nav-btn" onClick={() => calNav(-1)}>‹</button>
							<button className="cal-nav-btn" onClick={() => calNav(1)}>›</button>
						</div>
					</div>
					<div className="cal-dow">
						<div className="cal-dow-lbl" style={{ color: "#f87171" }}>일</div>
						<div className="cal-dow-lbl">월</div>
						<div className="cal-dow-lbl">화</div>
						<div className="cal-dow-lbl">수</div>
						<div className="cal-dow-lbl">목</div>
						<div className="cal-dow-lbl">금</div>
						<div className="cal-dow-lbl" style={{ color: "#60a5fa" }}>토</div>
					</div>
					<div className="cal-grid-7">
						{Array.from({ length: firstDow }, (_, i) => (
							<div className="cal-cell dim" key={`prev${i}`}>{daysInPrev - firstDow + 1 + i}</div>
						))}
						{Array.from({ length: daysInMonth }, (_, i) => {
							const d = i + 1;
							const evs = eventsByDay[d] || [];
							const seenColors = [...new Set(evs.map((e) => EVENT_TYPE_STYLE[e.type]?.color || "#888"))];
							let cls = "cal-cell";
							if (d === selDay) cls += " selected";
							else if (d === todayDay) cls += " today";
							return (
								<div className={cls} key={d} onClick={() => setSelDay(d)}>
									<div style={{ fontSize: "11px", fontWeight: 500, lineHeight: 1 }}>{d}</div>
									{seenColors.map((c) => (
										<div className="event-bar" style={{ background: c }} key={c}></div>
									))}
								</div>
							);
						})}
					</div>
				</div>

				<div>
					<div className="card">
						<div className="card-title">
							{calMonth}월 {selDay}일 {WEEKDAYS[selDow]}요일{selIsToday ? " — 오늘" : ""}
						</div>
						{loading ? (
							<div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", padding: "24px 0" }}>불러오는 중...</div>
						) : selEvents.length === 0 ? (
							<div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", padding: "24px 0" }}>이 날의 일정이 없습니다</div>
						) : (
							selEvents.map((e) => {
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
							})
						)}
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="shareEventModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">공유 이벤트 등록</div>
					<button className="modal-close" onClick={() => closeModal("shareEventModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이벤트명</label>
						<input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 본사 공지" />
					</div>
					<div className="form-field">
						<label>날짜</label>
						<input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
					</div>
					<div className="form-field">
						<label>공유 범위</label>
						<select value={newScope} onChange={(e) => setNewScope(e.target.value)}>
							<option value="PLATFORM">해당 플랫폼 내</option>
							<option value="ALL_MANAGER">전체 매니저</option>
							<option value="INCLUDE_OWNER">오너 포함</option>
							<option value="INCLUDE_ADMIN">강사 포함</option>
						</select>
					</div>
					{saveError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{saveError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("shareEventModal")}>취소</button>
						<button className="btn btn-primary" onClick={submitEvent}>저장</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
