import { useState, useEffect, useCallback } from "react";
import { listStaffPayroll, INCOME_TYPE_LABEL } from "../../api/common.js";
import { exportCsv } from "../../utils/exportCsv.js";

const ROLE_LABEL = { OWNER: "오너", MANAGER: "매니저", TUTOR: "강사", TAX_ACCOUNTANT: "세무사" };

export default function TaxAccountantStaffView({ platformId }) {
	const [staff, setStaff] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setStaff([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setStaff(await listStaffPayroll(platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function handleExport() {
		exportCsv(
			"직원정보.csv",
			["이름", "역할", "연락처", "이메일", "은행", "계좌번호", "예금주", "소득유형", "원천징수세율"],
			staff.map((s) => [
				s.name, ROLE_LABEL[s.role] || s.role, s.phone || "", s.email,
				s.bankName || "", s.bankAccountNumber || "", s.bankAccountHolder || "",
				s.incomeType ? INCOME_TYPE_LABEL[s.incomeType] : "", s.withholdingRateLabel || ""
			])
		);
	}

	return (
		<div className="page" id="taxacct-staff">
			<div className="page-header">
				<div className="page-label">Tax Accountant / Staff</div>
				<div className="page-title">직원 정보</div>
				<div className="page-subtitle">이 플랫폼 오너·매니저·강사의 개인정보와 정산 계좌를 확인하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
				<button className="btn btn-ghost btn-sm" disabled={staff.length === 0} onClick={handleExport}>
					📊 엑셀로 내보내기
				</button>
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>이름</th><th>역할</th><th>연락처</th><th>이메일</th><th>정산 계좌</th><th>소득유형</th><th>원천징수세율</th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : staff.length === 0 ? (
								<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 직원이 없습니다</td></tr>
							) : (
								staff.map((s) => (
									<tr key={s.userId}>
										<td style={{ fontWeight: 600 }}>{s.name}</td>
										<td>
											<span className="plat-chip">{ROLE_LABEL[s.role] || s.role}</span>
										</td>
										<td>{s.phone || "-"}</td>
										<td>{s.email}</td>
										<td>
											{s.bankName && s.bankAccountNumber ? (
												<span style={{ fontFamily: "'DM Mono',monospace" }}>
													{s.bankName} {s.bankAccountNumber} ({s.bankAccountHolder || s.name})
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
