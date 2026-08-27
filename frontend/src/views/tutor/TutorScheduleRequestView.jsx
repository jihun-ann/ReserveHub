import { useState, useEffect, useCallback } from "react";
import {
	listMyScheduleRequests, listPlatforms, listMySlots, listMyLessons,
	listReservationsForSlot, createScheduleChangeRequest, getUser
} from "../../api/common.js";

const STATUS_STYLE = {
	PENDING: { label: "검토 중", background: "rgba(246,173,85,0.12)", color: "var(--accent3)" },
	APPROVED: { label: "승인됨", className: "res-status rs-completed" },
	REJECTED: { label: "반려됨", className: "res-status rs-canceled" }
};
const DAY_LABEL = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TutorScheduleRequestView() {
	const [requests, setRequests] = useState([]);
	const [platformsById, setPlatformsById] = useState({});
	const [loading, setLoading] = useState(true);

	const [mySlots, setMySlots] = useState([]);
	const [selectedSlotId, setSelectedSlotId] = useState("");
	const [dateLessons, setDateLessons] = useState([]);
	const [selectedLessonId, setSelectedLessonId] = useState("");
	const [reservations, setReservations] = useState([]);
	const [studentNames, setStudentNames] = useState({});
	const [selectedReservationId, setSelectedReservationId] = useState("");
	const [requestedDate, setRequestedDate] = useState("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");

	const refresh = useCallback(async () => {
		setLoading(true);
		const [requestList, platforms, slots] = await Promise.all([
			listMyScheduleRequests(),
			listPlatforms(),
			listMySlots()
		]);
		setRequests(requestList);
		setPlatformsById(Object.fromEntries(platforms.map((p) => [p.id, p.name])));
		setMySlots(slots);
		setLoading(false);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function pickSlot(slotId) {
		setSelectedSlotId(slotId);
		setDateLessons([]);
		setSelectedLessonId("");
		setSelectedReservationId("");
		setReservations([]);
		if (!slotId) return;
		const today = new Date();
		const from = isoDate(new Date(today.getTime() - 14 * 86400000));
		const to = isoDate(new Date(today.getTime() + 60 * 86400000));
		const lessons = (await listMyLessons(from, to)).filter((l) => l.slotId === slotId);
		setDateLessons(lessons);
	}

	async function pickDate(lessonId) {
		setSelectedLessonId(lessonId);
		setSelectedReservationId("");
		setReservations([]);
		const lesson = dateLessons.find((l) => l.id === lessonId);
		if (!lesson) return;
		const list = (await listReservationsForSlot(lesson.slotId, lesson.lessonDate)).filter((r) => r.status === "CONFIRMED");
		setReservations(list);
		const names = await Promise.all(list.map((r) => getUser(r.userId)));
		setStudentNames(Object.fromEntries(list.map((r, i) => [r.userId, names[i].name])));
	}

	async function submit() {
		setSubmitError("");
		if (!selectedReservationId || !requestedDate) return;
		const lesson = dateLessons.find((l) => l.id === selectedLessonId);
		setSubmitting(true);
		try {
			await createScheduleChangeRequest(lesson.platformId, {
				reservationId: selectedReservationId,
				requestedDate,
				reason: reason.trim() || null
			});
			setSelectedSlotId("");
			setDateLessons([]);
			setSelectedLessonId("");
			setSelectedReservationId("");
			setReservations([]);
			setRequestedDate("");
			setReason("");
			await refresh();
		} catch (err) {
			setSubmitError(err.message || "요청 제출에 실패했습니다.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div id="tutor-request" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / Schedule Request</div>
				<div className="page-title">일정 변경 요청</div>
				<div className="page-subtitle">수강생의 일정 변경을 요청하고 처리 현황을 확인하세요</div>
			</div>

			<div className="card" style={{ marginBottom: "24px" }}>
				<div className="card-title">📝 새 변경 요청 작성</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", marginBottom: "14px" }}>
					<div className="form-field">
						<label>어떤 수업</label>
						<select value={selectedSlotId} onChange={(e) => pickSlot(e.target.value)}>
							<option value="">수업을 선택하세요</option>
							{mySlots.map((s) => (
								<option key={s.id} value={s.id}>
									{s.programName} ({platformsById[s.platformId] || "-"}, 매주 {DAY_LABEL[s.dayOfWeek]} {s.startTime?.slice(0, 5)})
								</option>
							))}
						</select>
					</div>
					<div className="form-field">
						<label>일자</label>
						<select value={selectedLessonId} onChange={(e) => pickDate(e.target.value)} disabled={!selectedSlotId}>
							<option value="">
								{!selectedSlotId ? "먼저 수업을 선택하세요" : dateLessons.length === 0 ? "예정된 날짜가 없습니다" : "일자를 선택하세요"}
							</option>
							{dateLessons.map((l) => (
								<option key={l.id} value={l.id}>{l.lessonDate}</option>
							))}
						</select>
					</div>
					<div className="form-field">
						<label>수강생</label>
						<select value={selectedReservationId} onChange={(e) => setSelectedReservationId(e.target.value)} disabled={reservations.length === 0}>
							<option value="">
								{selectedLessonId ? (reservations.length === 0 ? "예약된 수강생이 없습니다" : "수강생을 선택하세요") : "먼저 일자를 선택하세요"}
							</option>
							{reservations.map((r) => (
								<option key={r.id} value={r.id}>{studentNames[r.userId] || r.userId}</option>
							))}
						</select>
					</div>
					<div className="form-field">
						<label>변경 희망 일정</label>
						<input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
					</div>
				</div>
				<div className="form-field" style={{ marginBottom: "14px" }}>
					<label>변경 사유</label>
					<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="변경이 필요한 이유를 상세히 작성해주세요..."></textarea>
				</div>
				{submitError && <div style={{ color: "var(--red)", fontSize: "12px", marginBottom: "8px" }}>{submitError}</div>}
				<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
					<button
						className="btn btn-primary"
						style={{ background: "var(--accent2)", color: "#0f0f13" }}
						disabled={submitting || !selectedReservationId || !requestedDate}
						onClick={submit}
					>
						{submitting ? "제출 중..." : "요청 제출"}
					</button>
				</div>
			</div>

			<div className="card-title" style={{ marginBottom: "14px" }}>요청 이력</div>

			{loading ? (
				<div style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : requests.length === 0 ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>
					제출한 일정 변경 요청이 없습니다
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{requests.map((r) => {
						const st = STATUS_STYLE[r.status];
						return (
							<div className="card" key={r.id}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
									<div style={{ fontSize: "14px", fontWeight: 700 }}>{r.reason || "일정 변경 요청"}</div>
									{st.className ? (
										<span className={st.className}>{st.label}</span>
									) : (
										<span className="res-status" style={{ background: st.background, color: st.color }}>{st.label}</span>
									)}
								</div>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>기존 일정</div>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.originalDate}</div>
									</div>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>변경 희망</div>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.requestedDate}</div>
									</div>
								</div>
								{r.status !== "PENDING" && r.decisionMemo && (
									<div style={{ marginBottom: "10px", fontSize: "12px", color: "var(--text-sub)" }}>
										<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
											{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
										</span>
										<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
									</div>
								)}
								<div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace" }}>
									{platformsById[r.platformId] || "-"}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
