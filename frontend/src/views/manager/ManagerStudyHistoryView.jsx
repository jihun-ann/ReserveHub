import { useState, useEffect, useCallback } from "react";
import { listLessonHistory, PROGRAM_TYPE_LABEL } from "../../api/common.js";

const today0 = new Date();
const YEARS = [today0.getFullYear(), today0.getFullYear() - 1, today0.getFullYear() - 2];

export default function ManagerStudyHistoryView({ platformId }) {
	const [year, setYear] = useState(today0.getFullYear());
	const [month, setMonth] = useState(0); // 0 = all
	const [instructor, setInstructor] = useState("all");
	const [type, setType] = useState("all");
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setLessons([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setLessons(await listLessonHistory(platformId, `${year}-01-01`, `${year}-12-31`));
		setLoading(false);
	}, [platformId, year]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const instructors = [...new Set(lessons.map((l) => l.instructorEmail))];

	const filtered = lessons.filter((l) => {
		const lessonMonth = Number(l.lessonDate.slice(5, 7));
		const matchMonth = month === 0 || lessonMonth === month;
		const matchInstructor = instructor === "all" || l.instructorEmail === instructor;
		const matchType = type === "all" || (type === "group" ? l.programType === "GROUP" : l.programType !== "GROUP");
		return matchMonth && matchInstructor && matchType;
	});

	const totalLessons = filtered.length;
	const groupCount = filtered.filter((l) => l.programType === "GROUP").length;
	const privateCount = totalLessons - groupCount;
	const totalStudents = filtered.reduce((sum, l) => sum + l.totalAttendance, 0);
	const totalPresent = filtered.reduce((sum, l) => sum + l.presentCount, 0);
	const attendRate = totalStudents === 0 ? 0 : Math.round((totalPresent / totalStudents) * 100);

	const byInstructor = {};
	filtered.forEach((l) => { byInstructor[l.instructorEmail] = (byInstructor[l.instructorEmail] || 0) + 1; });
	const maxByInstructor = Math.max(1, ...Object.values(byInstructor));

	const selectStyle = {
		padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)",
		borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none"
	};

	return (
		<div className="page" id="manager-history">
			<div className="page-header">
				<div className="page-label">HISTORY</div>
				<div className="page-title">수업 이력</div>
				<div className="page-subtitle">강사별·기간별 수업 현황을 분석하세요</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
				<select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
					{YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
				</select>
				<select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
					<option value={0}>전체 월</option>
					{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
				</select>
				<select value={instructor} onChange={(e) => setInstructor(e.target.value)} style={selectStyle}>
					<option value="all">전체 강사</option>
					{instructors.map((i) => <option key={i} value={i}>{i}</option>)}
				</select>
				<select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
					<option value="all">전체 유형</option>
					<option value="group">그룹 레슨</option>
					<option value="private">개인 레슨</option>
				</select>
			</div>

			<div className="hist-kpi">
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : totalLessons}</div>
					<div className="kpi-key">총 수업</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--manager)" }}>{loading ? "-" : groupCount}</div>
					<div className="kpi-key">그룹 레슨</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : privateCount}</div>
					<div className="kpi-key">개인 레슨</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--green)" }}>{loading ? "-" : totalStudents}</div>
					<div className="kpi-key">수강 인원</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={{ color: "var(--green)" }}>{loading ? "-" : `${attendRate}%`}</div>
					<div className="kpi-key">출결률</div>
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "18px" }}>
				<div className="card">
					<div className="card-title">강사별 수업 수</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
						{Object.keys(byInstructor).length === 0 ? (
							<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>데이터가 없습니다</div>
						) : (
							Object.entries(byInstructor).map(([name, count]) => (
								<div key={name}>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
										<span>{name}</span>
										<span style={{ fontFamily: "'DM Mono',monospace", color: "var(--manager)" }}>{count}</span>
									</div>
									<div style={{ height: "6px", background: "var(--surface2)", borderRadius: "3px", overflow: "hidden" }}>
										<div style={{ width: `${(count / maxByInstructor) * 100}%`, height: "100%", background: "var(--manager)" }}></div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
				<div className="card" style={{ padding: "0", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
								<tr><th>날짜</th><th>강사</th><th>유형</th><th>프로그램</th><th>정원</th><th>출석</th><th>출결률</th></tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
								) : filtered.length === 0 ? (
									<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>수업 이력이 없습니다</td></tr>
								) : (
									filtered.map((l) => {
										const rate = l.totalAttendance === 0 ? 0 : Math.round((l.presentCount / l.totalAttendance) * 100);
										return (
											<tr key={l.id}>
												<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{l.lessonDate}</td>
												<td>{l.instructorEmail}</td>
												<td>{PROGRAM_TYPE_LABEL[l.programType] || l.programType}</td>
												<td>{l.programName}</td>
												<td>{l.capacity}</td>
												<td>{l.presentCount}/{l.totalAttendance}</td>
												<td style={{ color: rate >= 80 ? "var(--green)" : rate >= 50 ? "var(--accent3)" : "var(--red)" }}>{rate}%</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
