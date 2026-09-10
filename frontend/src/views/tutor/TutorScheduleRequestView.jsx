import { useState, useEffect, useCallback } from "react";
import { Palmtree } from "lucide-react";
import {
	listMyScheduleRequests, listPlatforms, listMySlots, listMyLessons,
	listReservationsForSlot, createScheduleChangeRequest, getUser,
	listMyLeaveRequests, createLeaveRequest
} from "../../api/common.js";
import { openModal, closeModal } from "../default.js";

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

export default function TutorScheduleRequestView({ platformId }) {
	const [requests, setRequests] = useState([]);
	const [platformsById, setPlatformsById] = useState({});
	const [loading, setLoading] = useState(true);

	const [mySlots, setMySlots] = useState([]);
	const [selectedSlotId, setSelectedSlotId] = useState("");
	const [dateLessons, setDateLessons] = useState([]);
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedLessonId, setSelectedLessonId] = useState("");
	const [reservations, setReservations] = useState([]);
	const [studentNames, setStudentNames] = useState({});
	const [selectedReservationId, setSelectedReservationId] = useState("");
	const [requestedDate, setRequestedDate] = useState("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");

	const [leaveRequests, setLeaveRequests] = useState([]);
	const [leaveStart, setLeaveStart] = useState("");
	const [leaveEnd, setLeaveEnd] = useState("");
	const [leaveReason, setLeaveReason] = useState("");
	const [leaveSubmitting, setLeaveSubmitting] = useState(false);
	const [leaveError, setLeaveError] = useState("");

	const refresh = useCallback(async () => {
		setLoading(true);
		const [requestList, platforms, slots, leaveList] = await Promise.all([
			listMyScheduleRequests(),
			listPlatforms(),
			listMySlots(),
			listMyLeaveRequests()
		]);
		setRequests(requestList.filter((r) => r.platformId === platformId));
		setPlatformsById(Object.fromEntries(platforms.map((p) => [p.id, p.name])));
		setMySlots(slots.filter((s) => s.platformId === platformId));
		setLeaveRequests(leaveList.filter((r) => r.platformId === platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function pickSlot(slotId) {
		setSelectedSlotId(slotId);
		setDateLessons([]);
		setSelectedLessonId("");
		setSelectedReservationId("");
		setReservations([]);
		if (!slotId) {
			setSelectedYear("");
			setSelectedMonth("");
			return;
		}
		// 년/월은 항상 고를 수 있으니, 고르는 수고를 덜게 오늘 날짜로 기본값을 잡아둔다.
		const today = new Date();
		setSelectedYear(String(today.getFullYear()));
		setSelectedMonth(String(today.getMonth() + 1).padStart(2, "0"));
		const from = isoDate(new Date(today.getTime() - 14 * 86400000));
		const to = isoDate(new Date(today.getTime() + 60 * 86400000));
		const lessons = (await listMyLessons(from, to)).filter((l) => l.slotId === slotId);
		setDateLessons(lessons);
	}

	function pickYear(y) {
		setSelectedYear(y);
		setSelectedMonth("");
		setSelectedLessonId("");
		setSelectedReservationId("");
		setReservations([]);
	}

	function pickMonth(m) {
		setSelectedMonth(m);
		setSelectedLessonId("");
		setSelectedReservationId("");
		setReservations([]);
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
			setSelectedYear("");
			setSelectedMonth("");
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

	function openLeaveModal() {
		setLeaveStart("");
		setLeaveEnd("");
		setLeaveReason("");
		setLeaveError("");
		openModal("leaveRequestModal");
	}

	async function submitLeave() {
		setLeaveError("");
		if (!leaveStart || !leaveEnd) return;
		setLeaveSubmitting(true);
		try {
			await createLeaveRequest(platformId, { startDate: leaveStart, endDate: leaveEnd, reason: leaveReason.trim() || null });
			closeModal("leaveRequestModal");
			await refresh();
		} catch (err) {
			setLeaveError(err.message || "요청 제출에 실패했습니다.");
		} finally {
			setLeaveSubmitting(false);
		}
	}

	// "일자"를 년/월/일로 나눠 고른다 — 년/월은 고를 수 있는 범위를 그대로 보여주고,
	// 실제로 예정된 수업이 있는지는 마지막 "일" 단계에서만 걸러낸다.
	const thisYear = new Date().getFullYear();
	const availableYears = [thisYear - 1, thisYear, thisYear + 1].map(String);
	const availableMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
	const availableDays = dateLessons
		.filter((l) => l.lessonDate.slice(0, 4) === selectedYear && l.lessonDate.slice(5, 7) === selectedMonth)
		.sort((a, b) => (a.lessonDate < b.lessonDate ? -1 : 1));

	return (
		<>
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
						<div style={{ display: "flex", gap: "6px" }}>
							<select value={selectedYear} onChange={(e) => pickYear(e.target.value)} disabled={!selectedSlotId}>
								<option value="">년도</option>
								{availableYears.map((y) => <option key={y} value={y}>{y}년</option>)}
							</select>
							<select value={selectedMonth} onChange={(e) => pickMonth(e.target.value)} disabled={!selectedYear}>
								<option value="">월</option>
								{availableMonths.map((m) => <option key={m} value={m}>{Number(m)}월</option>)}
							</select>
							<select value={selectedLessonId} onChange={(e) => pickDate(e.target.value)} disabled={!selectedMonth}>
								<option value="">일</option>
								{availableDays.map((l) => (
									<option key={l.id} value={l.id}>{Number(l.lessonDate.slice(8, 10))}일</option>
								))}
							</select>
						</div>
						{selectedYear && selectedMonth && availableDays.length === 0 && (
							<div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
								이 달엔 예정된 수업이 없습니다
							</div>
						)}
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
								<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px", marginBottom: "12px" }}>
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
									{platformsById[r.platformId] || "-"} · 신청일시 {r.createdAt ? new Date(r.createdAt).toLocaleString("ko-KR") : "-"}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0 14px" }}>
				<div className="card-title" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}><Palmtree size={15} strokeWidth={1.75} /> 휴가 요청</div>
				<button className="btn btn-primary btn-sm" style={{ background: "var(--accent2)", color: "#0f0f13" }} onClick={openLeaveModal}>
					+ 휴가 요청
				</button>
			</div>

			{leaveRequests.length === 0 ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>
					제출한 휴가 요청이 없습니다
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{leaveRequests.map((r) => {
						const st = STATUS_STYLE[r.status];
						return (
							<div className="card" key={r.id}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
									<div style={{ fontSize: "14px", fontWeight: 700 }}>{r.startDate} ~ {r.endDate} 휴가</div>
									{st.className ? (
										<span className={st.className}>{st.label}</span>
									) : (
										<span className="res-status" style={{ background: st.background, color: st.color }}>{st.label}</span>
									)}
								</div>
								{r.reason && <div style={{ fontSize: "13px", color: "var(--text-sub)", marginBottom: "8px" }}>{r.reason}</div>}
								{r.status !== "PENDING" && r.decisionMemo && (
									<div style={{ marginBottom: "8px", fontSize: "12px", color: "var(--text-sub)" }}>
										<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
											{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
										</span>
										<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
									</div>
								)}
								<div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace" }}>
									{platformsById[r.platformId] || "-"} · 신청일시 {r.createdAt ? new Date(r.createdAt).toLocaleString("ko-KR") : "-"}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>

		<div className="modal-overlay" id="leaveRequestModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">휴가 요청</div>
					<button className="modal-close" onClick={() => closeModal("leaveRequestModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
						<div className="form-field">
							<label>시작일</label>
							<input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
						</div>
						<div className="form-field">
							<label>종료일</label>
							<input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
						</div>
					</div>
					<div className="form-field">
						<label>사유 (선택)</label>
						<textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="휴가 사유를 작성해주세요..."></textarea>
					</div>
					{leaveError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{leaveError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("leaveRequestModal")}>취소</button>
						<button
							className="btn btn-primary"
							disabled={leaveSubmitting || !leaveStart || !leaveEnd}
							onClick={submitLeave}
						>
							{leaveSubmitting ? "제출 중..." : "휴가 요청 제출"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
