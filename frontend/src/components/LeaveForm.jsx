import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createLeaveRequest, listMyLeaveRequests } from "../api/common.js";

// 휴가 신청 — 이번 주부터 3주를 캘린더처럼 보여주고, 날짜를 여러 개 골라 올린다.
// 날짜를 누를 때마다 그날을 연차(종일)로 쓸지 시간 단위(1~7시간)로 쓸지 정한다.
// 근무계획은 아직 근무표 데이터가 없어 요일로만 표시한다(토 = 휴무, 일 = 휴일).
// 서버는 휴가 한 건을 시작~끝(또는 하루 + 시간)으로 저장하므로, 종일인 날은 붙어 있는 묶음마다 한 건,
// 시간 단위인 날은 하루마다 한 건씩 올린다.
const DAYS = 21;
const STEP = 7;
const DOW = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const USED_STATUS = { PENDING: "대기", APPROVED: "승인" };
const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const short = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;
const kindLabel = (hours) => (hours ? `${hours}시간` : "연차");

function daysBetween(a, b) {
	const [from, to] = a <= b ? [a, b] : [b, a];
	const out = [];
	for (let d = fromIso(from); iso(d) <= to; d = addDays(d, 1)) out.push(iso(d));
	return out;
}

// 신청할 묶음 — 종일인 날은 붙어 있는 것끼리 [시작, 끝], 시간 단위인 날은 하루씩.
function toRequests(selected) {
	const out = [];
	for (const day of Object.keys(selected).sort()) {
		const hours = selected[day];
		const last = out[out.length - 1];
		if (!hours && last && !last.hours && iso(addDays(fromIso(last.endDate), 1)) === day) last.endDate = day;
		else out.push({ startDate: day, endDate: day, hours });
	}
	return out;
}

export default function LeaveForm({ platformId, onSubmitted, onCancel }) {
	const today = iso(new Date());
	const firstMonday = mondayOf(new Date());
	const [start, setStart] = useState(firstMonday);
	const [selected, setSelected] = useState({}); // 날짜 → 시간(null이면 종일)
	const [used, setUsed] = useState({}); // 날짜 → 이미 신청한 휴가 { status, hours }
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		listMyLeaveRequests().then((list) => {
			const map = {};
			list.filter((r) => r.platformId === platformId && USED_STATUS[r.status])
				.forEach((r) => daysBetween(r.startDate, r.endDate).forEach((d) => { map[d] = { status: r.status, hours: r.hours }; }));
			setUsed(map);
		}).catch(() => setUsed({}));
	}, [platformId]);

	const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
	const last = days[DAYS - 1];
	const navLabel = start.getMonth() === last.getMonth()
		? `${start.getFullYear()}년 ${start.getMonth() + 1}월`
		: `${start.getFullYear()}년 ${start.getMonth() + 1}월 – ${start.getFullYear() !== last.getFullYear() ? `${last.getFullYear()}년 ` : ""}${last.getMonth() + 1}월`;
	const requests = toRequests(selected);
	const count = Object.keys(selected).length;

	function unselect(day) {
		setSelected((prev) => {
			const next = { ...prev };
			delete next[day];
			return next;
		});
	}

	// 누르면 연차로 고르고, 다시 누르면 뺀다. 종류는 아래 목록에서 날짜마다 정한다.
	function pick(day) {
		setError("");
		if (day in selected) unselect(day);
		else setSelected((prev) => ({ ...prev, [day]: null }));
	}

	function setKind(day, hours) {
		setSelected((prev) => ({ ...prev, [day]: hours }));
	}

	async function submit() {
		setError("");
		setSubmitting(true);
		let done = 0;
		try {
			for (const r of requests) {
				await createLeaveRequest(platformId, { ...r, reason: reason.trim() || null });
				done++;
			}
			onSubmitted();
		} catch (err) {
			// 일부만 올라갔으면 몇 건이 됐는지 알려 준다.
			setError(`${done > 0 ? `${requests.length}건 중 ${done}건만 신청됐습니다. ` : ""}${err.message || "신청에 실패했습니다."}`);
		} finally {
			setSubmitting(false);
		}
	}

	function noteOf(d, day) {
		if (used[day]) return `${used[day].hours ? `${used[day].hours}시간` : "휴가"} ${USED_STATUS[used[day].status]}`;
		if (day in selected) return kindLabel(selected[day]);
		if (d.getDay() === 0) return "휴일";
		if (d.getDay() === 6) return "휴무";
		return "";
	}

	const summary = count === 0
		? "날짜를 눌러 선택하세요"
		: `${count}일 · ${requests.map((r) => (r.hours ? `${short(r.startDate)} ${r.hours}시간` : r.startDate === r.endDate ? short(r.startDate) : `${short(r.startDate)}~${short(r.endDate)}`)).join(", ")}${requests.length > 1 ? ` (${requests.length}건으로 신청)` : ""}`;

	const pickedDays = Object.keys(selected).sort();

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
			<div>
				<div style={{ fontSize: "13px", fontWeight: 600 }}>휴가 사용일</div>
				<div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>날짜를 누르면 아래에 차례로 추가됩니다. 날짜마다 연차인지 시간 단위인지 정하세요</div>
			</div>

			<div>
				<div className="leave-nav">
					<span className="leave-nav-label">{navLabel}</span>
					<span style={{ display: "inline-flex", gap: "8px" }}>
						<button type="button" className="leave-nav-btn" aria-label="이전 주" disabled={start <= firstMonday} onClick={() => setStart(addDays(start, -STEP))}>
							<ChevronLeft size={16} strokeWidth={1.5} />
						</button>
						<button type="button" className="leave-nav-btn" aria-label="다음 주" onClick={() => setStart(addDays(start, STEP))}>
							<ChevronRight size={16} strokeWidth={1.5} />
						</button>
					</span>
				</div>
				<div className="leave-dow">
					{DOW.map((w, i) => (
						<div key={w} style={i === 5 ? { color: "var(--accent)" } : i === 6 ? { color: "var(--red)" } : undefined}>{w}</div>
					))}
				</div>
				<div className="leave-grid">
					{days.map((d) => {
						const day = iso(d);
						const cls = [
							"leave-cell",
							d.getDay() === 6 && "sat",
							d.getDay() === 0 && "sun",
							day === today && "today",
							used[day] && "used",
							day in selected && "selected"
						].filter(Boolean).join(" ");
						return (
							<button key={day} type="button" className={cls} disabled={day < today || !!used[day]} onClick={() => pick(day)} aria-pressed={day in selected}>
								<span className="leave-date">{d.getDate() === 1 ? short(day) : d.getDate()}</span>
								<span className="leave-note">{noteOf(d, day)}</span>
							</button>
						);
					})}
				</div>
			</div>

			{pickedDays.length > 0 && (
				<div className="leave-kind-list">
					{pickedDays.map((day) => (
						<div key={day} className="leave-kind">
							<span className="leave-kind-date">
								{Number(day.slice(5, 7))}월 {Number(day.slice(8, 10))}일 ({WEEKDAY[fromIso(day).getDay()]})
							</span>
							<div className="seg">
								<button type="button" className={!selected[day] ? "active" : ""} onClick={() => setKind(day, null)}>연차 (종일)</button>
								<button type="button" className={selected[day] ? "active" : ""} onClick={() => setKind(day, selected[day] || 2)}>시간 단위</button>
							</div>
							{selected[day] && (
								<select aria-label={`${day} 휴가 시간`} value={selected[day]} onChange={(e) => setKind(day, Number(e.target.value))}>
									{HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}시간</option>)}
								</select>
							)}
							<button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => unselect(day)}>빼기</button>
						</div>
					))}
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
				<span style={{ fontSize: "13px", color: count ? "var(--text)" : "var(--text-dim)" }}>{summary}</span>
				<span className="leave-legend">
					<span><i style={{ background: "var(--surface2)" }} />신청한 휴가</span>
					<span><i style={{ background: "var(--accent)", borderColor: "var(--accent)" }} />선택한 날짜</span>
				</span>
			</div>

			<div className="form-field">
				<label>사유 (선택)</label>
				<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 개인 사정, 병원 진료" />
			</div>
			{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button type="button" className="btn btn-ghost" onClick={onCancel}>뒤로</button>
				<button type="button" className="btn btn-primary" disabled={submitting || count === 0} onClick={submit}>
					{submitting ? "신청 중" : "신청"}
				</button>
			</div>
		</div>
	);
}
