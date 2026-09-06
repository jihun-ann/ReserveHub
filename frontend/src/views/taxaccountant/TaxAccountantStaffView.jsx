import { useState, useEffect, useCallback } from "react";
import { listStaffPayroll, INCOME_TYPE_LABEL } from "../../api/common.js";
import { exportCsv } from "../../utils/exportCsv.js";

const ROLE_LABEL = { OWNER: "오너", MANAGER: "매니저", TUTOR: "강사", TAX_ACCOUNTANT: "세무사" };

const today0 = new Date();
const YEARS = [today0.getFullYear(), today0.getFullYear() - 1];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function won(n) {
	return (n || 0).toLocaleString("ko-KR");
}

export default function TaxAccountantStaffView({ platformId }) {
	const [year, setYear] = useState(today0.getFullYear());
	const [month, setMonth] = useState(today0.getMonth() + 1);
	const [staff, setStaff] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setStaff([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setStaff(await listStaffPayroll(platformId, year, month));
		setLoading(false);
	}, [platformId, year, month]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function handleExport() {
		exportCsv(
			`직원정보_${year}년${month}월.csv`,
			["이름", "역할", "연락처", "이메일", "은행", "계좌번호", "예금주", "소득유형", "원천징수세율", "이번달 수업횟수", "출석 학생수", "정산총액", "원천징수세액", "실지급액"],
			staff.map((s) => [
				s.name, ROLE_LABEL[s.role] || s.role, s.phone || "", s.email,
				s.bankName || "", s.bankAccountNumber || "", s.bankAccountHolder || "",
				s.incomeType ? INCOME_TYPE_LABEL[s.incomeType] : "", s.withholdingRateLabel || "",
				s.role === "TUTOR" ? s.lessonCount : "", s.role === "TUTOR" ? s.attendanceCount : "",
				s.grossSettlement || "", s.withholdingTaxAmount ?? "", s.netSettlement ?? ""
			])
		);
	}

	const selectStyle = {
		padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)",
		borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none"
	};

	return (
		<div className="page" id="taxacct-staff">
			<div className="page-header">
				<div className="page-label">Tax Accountant / Staff</div>
				<div className="page-title">직원 정보</div>
				<div className="page-subtitle">이 플랫폼 오너·매니저·강사·세무사의 개인정보, 정산 계좌, 이번 달 강사 정산액을 확인하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
				<div style={{ display: "flex", gap: "8px" }}>
					<select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
						{YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
					</select>
					<select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
						{MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
					</select>
				</div>
				<button className="btn btn-ghost btn-sm" disabled={staff.length === 0} onClick={handleExport}>
					📊 엑셀로 내보내기
				</button>
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>이름</th><th>역할</th><th>연락처</th><th>이메일</th><th>정산 계좌</th>
								<th>소득유형</th><th>원천징수세율</th>
								<th>이번달 수업</th><th>출석 학생</th><th>정산총액</th><th>원천징수세액</th><th>실지급액</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={12} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : staff.length === 0 ? (
								<tr><td colSpan={12} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 직원이 없습니다</td></tr>
							) : (
								staff.map((s) => (
									<tr key={s.userId + s.role}>
										<td style={{ fontWeight: 600 }}>{s.name}</td>
										<td>
											<span className="plat-chip">{ROLE_LABEL[s.role] || s.role}</span>
										</td>
										<td>{s.phone || "-"}</td>
										<td>{s.email}</td>
										<td>
											{s.bankName && s.bankAccountNumber ? (
												<span>
													{s.bankName} <span style={{ fontFamily: "'DM Mono',monospace" }}>{s.bankAccountNumber}</span> ({s.bankAccountHolder || s.name})
												</span>
											) : (
												<span style={{ color: "var(--text-dim)" }}>미등록</span>
											)}
										</td>
										<td>{s.incomeType ? INCOME_TYPE_LABEL[s.incomeType] : <span style={{ color: "var(--text-dim)" }}>미지정</span>}</td>
										<td style={{ fontSize: "12px" }}>
											{s.incomeType === "EMPLOYMENT" ? (
												<span className="badge bs-soon" style={{ fontSize: "10px" }}>간이세액표 확인 필요</span>
											) : (
												s.withholdingRateLabel || "-"
											)}
										</td>
										{s.role === "TUTOR" ? (
											<>
												<td style={{ fontFamily: "'DM Mono',monospace" }}>
													{s.lessonCount}회{s.sessionRate != null ? ` (회당 ${won(s.sessionRate)}원)` : ""}
												</td>
												<td style={{ fontFamily: "'DM Mono',monospace" }}>{s.attendanceCount}명</td>
												<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--taxacct)" }}>
													{s.sessionRate != null ? `${won(s.grossSettlement)}원` : <span style={{ color: "var(--text-dim)" }}>강사료 미지정</span>}
												</td>
												<td style={{ fontFamily: "'DM Mono',monospace" }}>
													{s.withholdingTaxAmount != null ? `${won(s.withholdingTaxAmount)}원` : "-"}
												</td>
												<td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
													{s.netSettlement != null ? `${won(s.netSettlement)}원` : "-"}
												</td>
											</>
										) : (
											<td colSpan={5} style={{ color: "var(--text-dim)", fontSize: "12px" }}>-</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
