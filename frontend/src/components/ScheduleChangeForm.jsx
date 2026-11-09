import { useState, useEffect } from "react";
import { listMyLessons, listReservationsForSlot, createScheduleChangeRequest, getUser } from "../api/common.js";

const DAY_LABEL = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 내가 담당하는 수업(slots)의 특정 회차·수강생을 골라 다른 날로 옮겨 달라는 결재 — 결재 신청 모달 안에서 쓴다.
export default function ScheduleChangeForm({ slots, onSubmitted, onCancel }) {
	const [slotId, setSlotId] = useState("");
	const [lessons, setLessons] = useState([]);
	const [year, setYear] = useState("");
	const [month, setMonth] = useState("");
	const [lessonId, setLessonId] = useState("");
	const [reservations, setReservations] = useState([]);
	const [studentNames, setStudentNames] = useState({});
	const [reservationId, setReservationId] = useState("");
	const [requestedDate, setRequestedDate] = useState("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!slotId) return;
		// 년/월은 오늘로 기본값을 잡고, 앞뒤 두 달 안의 회차만 불러온다.
		const today = new Date();
		setYear(String(today.getFullYear()));
		setMonth(pad(today.getMonth() + 1));
		const from = isoDate(new Date(today.getTime() - 14 * 86400000));
		const to = isoDate(new Date(today.getTime() + 60 * 86400000));
		listMyLessons(from, to).then((list) => setLessons(list.filter((l) => l.slotId === slotId))).catch(() => setLessons([]));
	}, [slotId]);

	function pickSlot(id) {
		setSlotId(id);
		setLessons([]);
		setLessonId("");
		setReservationId("");
		setReservations([]);
	}

	async function pickLesson(id) {
		setLessonId(id);
		setReservationId("");
		setReservations([]);
		const lesson = lessons.find((l) => l.id === id);
		if (!lesson) return;
		const list = (await listReservationsForSlot(lesson.slotId, lesson.lessonDate)).filter((r) => r.status === "CONFIRMED");
		setReservations(list);
		const users = await Promise.all(list.map((r) => getUser(r.userId).catch(() => null)));
		setStudentNames(Object.fromEntries(list.map((r, i) => [r.userId, users[i]?.name])));
	}

	async function submit() {
		setError("");
		const lesson = lessons.find((l) => l.id === lessonId);
		if (!lesson || !reservationId || !requestedDate) return;
		setSubmitting(true);
		try {
			await createScheduleChangeRequest(lesson.platformId, { reservationId, requestedDate, reason: reason.trim() || null });
			onSubmitted();
		} catch (err) {
			setError(err.message || "신청에 실패했습니다.");
		} finally {
			setSubmitting(false);
		}
	}

	const thisYear = new Date().getFullYear();
	const years = [thisYear - 1, thisYear, thisYear + 1].map(String);
	const months = Array.from({ length: 12 }, (_, i) => pad(i + 1));
	const days = lessons
		.filter((l) => l.lessonDate.slice(0, 4) === year && l.lessonDate.slice(5, 7) === month)
		.sort((a, b) => (a.lessonDate < b.lessonDate ? -1 : 1));

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div className="form-field">
				<label>수업</label>
				<select value={slotId} onChange={(e) => pickSlot(e.target.value)}>
					<option value="">수업 선택</option>
					{slots.map((s) => (
						<option key={s.id} value={s.id}>{s.programName} (매주 {DAY_LABEL[s.dayOfWeek]} {s.startTime?.slice(0, 5)})</option>
					))}
				</select>
			</div>
			<div className="form-field">
				<label>회차</label>
				<div style={{ display: "flex", gap: "8px" }}>
					<select value={year} onChange={(e) => { setYear(e.target.value); setLessonId(""); }} disabled={!slotId}>
						<option value="">년도</option>
						{years.map((y) => <option key={y} value={y}>{y}년</option>)}
					</select>
					<select value={month} onChange={(e) => { setMonth(e.target.value); setLessonId(""); }} disabled={!year}>
						<option value="">월</option>
						{months.map((m) => <option key={m} value={m}>{Number(m)}월</option>)}
					</select>
					<select value={lessonId} onChange={(e) => pickLesson(e.target.value)} disabled={!month}>
						<option value="">일</option>
						{days.map((l) => <option key={l.id} value={l.id}>{Number(l.lessonDate.slice(8, 10))}일</option>)}
					</select>
				</div>
				{slotId && year && month && days.length === 0 && (
					<div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>이 달엔 예정된 수업이 없습니다</div>
				)}
			</div>
			<div className="form-field">
				<label>수강생</label>
				<select value={reservationId} onChange={(e) => setReservationId(e.target.value)} disabled={reservations.length === 0}>
					<option value="">{lessonId ? (reservations.length === 0 ? "예약된 수강생이 없습니다" : "수강생 선택") : "회차를 먼저 고르세요"}</option>
					{reservations.map((r) => <option key={r.id} value={r.id}>{studentNames[r.userId] || r.userId}</option>)}
				</select>
			</div>
			<div className="form-field">
				<label>옮길 날짜</label>
				<input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
			</div>
			<div className="form-field">
				<label>사유</label>
				<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="변경 사유" />
			</div>
			{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button className="btn btn-ghost" onClick={onCancel}>뒤로</button>
				<button className="btn btn-primary" disabled={submitting || !reservationId || !requestedDate} onClick={submit}>
					{submitting ? "신청 중" : "신청"}
				</button>
			</div>
		</div>
	);
}
