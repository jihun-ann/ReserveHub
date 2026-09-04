import { useState, useEffect, useCallback, useRef } from "react";
import { listMyLessons, PROGRAM_TYPE_LABEL } from "../../api/common.js";

const today0 = new Date();
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function attendTier(rate) {
	return rate >= 80 ? "high" : rate >= 50 ? "mid" : "low";
}

export default function TutorAttendanceHistoryView({ platformId }) {
	const [year, setYear] = useState(today0.getFullYear());
	const [month, setMonth] = useState(today0.getMonth() + 1);
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pickerOpen, setPickerOpen] = useState(false);
	const pickerRef = useRef(null);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setLessons([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const all = await listMyLessons(`${year}-01-01`, `${year}-12-31`);
		setLessons(all.filter((l) => l.platformId === platformId));
		setLoading(false);
	}, [platformId, year]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// 달력 스탬프를 눌러 여는 월 피커 — 바깥을 클릭하면 닫는다.
	useEffect(() => {
		if (!pickerOpen) return;
		function handleOutsideClick(e) {
			if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
		}
		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [pickerOpen]);

	function navMonth(delta) {
		let y = year, m = month + delta;
		if (m > 12) { m = 1; y++; }
		if (m < 1) { m = 12; y--; }
		setYear(y);
		setMonth(m);
	}

	function pickMonth(m) {
		setMonth(m);
		setPickerOpen(false);
	}

	const filtered = lessons
		.filter((l) => Number(l.lessonDate.slice(5, 7)) === month)
		.sort((a, b) => (a.lessonDate < b.lessonDate ? 1 : -1));

	const totalLessons = filtered.length;
	const totalStudents = filtered.reduce((sum, l) => sum + l.totalAttendance, 0);
	const totalPresent = filtered.reduce((sum, l) => sum + l.presentCount, 0);
	const attendRate = totalStudents === 0 ? 0 : Math.round((totalPresent / totalStudents) * 100);

	return (
		<div className="page" id="tutor-attend-history">
			<div className="page-header">
				<div className="page-label">Tutor / Attendance History</div>
				<div className="page-title">출석 이력</div>
				<div className="page-subtitle">지난 수업의 출결 현황을 확인하세요</div>
			</div>

			<div className="hist-nav">
				<button type="button" className="hist-nav-btn" onClick={() => navMonth(-1)}>
					<span className="hist-nav-arrow">‹</span>
					<span className="hist-nav-text">이전 달</span>
				</button>

				<div className="month-stamp-wrap" ref={pickerRef}>
					<button
						type="button"
						className="month-stamp"
						onClick={() => setPickerOpen((v) => !v)}
						aria-expanded={pickerOpen}
					>
						<span className="month-stamp-year">{year}</span>
						<span className="month-stamp-num">{String(month).padStart(2, "0")}</span>
						<span className="month-stamp-label">{MONTH_LABELS[month - 1]}</span>
					</button>

					{pickerOpen && (
						<div className="month-picker">
							<div className="month-picker-year">
								<button type="button" className="cal-btn" onClick={() => setYear((y) => y - 1)} aria-label="이전 연도">‹</button>
								<span>{year}년</span>
								<button type="button" className="cal-btn" onClick={() => setYear((y) => y + 1)} aria-label="다음 연도">›</button>
							</div>
							<div className="month-picker-grid">
								{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
									<button
										type="button"
										key={m}
										className={`month-picker-cell${m === month ? " active" : ""}`}
										onClick={() => pickMonth(m)}
									>
										{m}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				<button type="button" className="hist-nav-btn" onClick={() => navMonth(1)}>
					<span className="hist-nav-arrow">›</span>
					<span className="hist-nav-text">다음 달</span>
				</button>
			</div>

			<div className="today-summary" style={{ marginBottom: "20px" }}>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : totalLessons}</div>
					<div className="summary-key">총 수업</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--green)" }}>{loading ? "-" : totalStudents}</div>
					<div className="summary-key">수강 인원</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : `${attendRate}%`}</div>
					<div className="summary-key">출결률</div>
				</div>
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="ledger-table">
						<thead>
							<tr><th>날짜</th><th>프로그램</th><th>출석</th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={3} className="ledger-empty">불러오는 중...</td></tr>
							) : filtered.length === 0 ? (
								<tr><td colSpan={3} className="ledger-empty">아직 기록된 수업이 없습니다</td></tr>
							) : (
								filtered.map((l) => {
									const rate = l.totalAttendance === 0 ? 0 : Math.round((l.presentCount / l.totalAttendance) * 100);
									const tier = attendTier(rate);
									const d = new Date(l.lessonDate);
									return (
										<tr key={l.id}>
											<td>
												<div className="ledger-date-stamp">
													<span className="stamp-day">{String(d.getDate()).padStart(2, "0")}</span>
													<span className="stamp-dow">{WEEKDAYS[d.getDay()]}</span>
												</div>
											</td>
											<td>
												<div className="ledger-program-name">{l.programName}</div>
												<span className="plat-chip ledger-type-chip">
													{PROGRAM_TYPE_LABEL[l.programType] || l.programType}
												</span>
											</td>
											<td>
												<div className="ledger-attend">
													<span className="ledger-attend-frac">{l.presentCount}/{l.totalAttendance}</span>
													<div className="ledger-bar">
														<div className={`ledger-bar-fill tier-${tier}`} style={{ width: `${rate}%` }}></div>
													</div>
													<span className={`ledger-attend-pct tier-${tier}`}>{rate}%</span>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
