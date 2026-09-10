import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet } from "lucide-react";
import { getRevenueSummary, getRevenueRecords, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, CASH_RECEIPT_STATUS_LABEL } from "../../api/common.js";
import { exportCsv } from "../../utils/exportCsv.js";

const today0 = new Date();
const YEARS = [today0.getFullYear(), today0.getFullYear() - 1, today0.getFullYear() - 2];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function won(n) {
	return (n || 0).toLocaleString("ko-KR");
}

const SUMMARY_CARDS = [
	{ key: "totalBilled", label: "총 청구액", color: "var(--taxacct)" },
	{ key: "totalCollected", label: "실제 수납액", color: "var(--accent2)" },
	{ key: "cardAmount", label: "카드", color: "var(--accent3)" },
	{ key: "cashReceiptAmount", label: "현금영수증", color: "var(--accent3)" },
	{ key: "bankTransferAmount", label: "계좌이체", color: "var(--accent3)" },
	{ key: "cashAmount", label: "현금", color: "var(--accent3)" },
	{ key: "refundAmount", label: "환불액", color: "var(--red)" },
	{ key: "outstandingAmount", label: "미수금", color: "var(--red)" },
	{ key: "netRevenue", label: "순매출", color: "var(--taxacct)" }
];

export default function TaxAccountantRevenueView({ platformId, platformName }) {
	const [year, setYear] = useState(today0.getFullYear());
	const [month, setMonth] = useState(today0.getMonth() + 1);
	const [includeTax, setIncludeTax] = useState(true);
	const [summary, setSummary] = useState(null);
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setSummary(null);
			setRecords([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [s, r] = await Promise.all([
			getRevenueSummary(platformId, year, month, includeTax),
			getRevenueRecords(platformId, year, month, includeTax)
		]);
		setSummary(s);
		setRecords(r);
		setLoading(false);
	}, [platformId, year, month, includeTax]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const selectStyle = {
		padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)",
		borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none"
	};

	function handleExport() {
		exportCsv(
			`매출자료_${platformName || "플랫폼"}_${year}년${month}월${includeTax ? "" : "_세액미포함"}.csv`,
			["학생", "학생ID", "보호자", "연락처", "수강과목/반", "수강기간", "청구금액", "할인", "실제결제액", "결제일", "결제수단", "현금영수증", "증빙번호", "상태", "환불금액", "환불일"],
			records.map((r) => [
				r.studentName, r.studentId, r.guardianName || "", r.guardianPhone || "",
				r.programName || "", r.enrollStart ? `${r.enrollStart} ~ ${r.enrollEnd || ""}` : "",
				r.billedAmount, r.discountAmount, r.paidAmount,
				r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "",
				r.paymentMethod ? PAYMENT_METHOD_LABEL[r.paymentMethod] : "",
				CASH_RECEIPT_STATUS_LABEL[r.cashReceiptStatus] || "",
				r.receiptNumber || "", ORDER_STATUS_LABEL[r.status] || r.status,
				r.refundAmount, r.refundedAt ? new Date(r.refundedAt).toLocaleDateString() : ""
			])
		);
	}

	return (
		<div className="page" id="taxacct-revenue">
			<div className="page-header">
				<div className="page-label">Tax Accountant / Revenue</div>
				<div className="page-title">매출 자료</div>
				<div className="page-subtitle">{platformName ? `${platformName}의 ` : ""}월별 매출과 학생별 결제 내역을 확인하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
				<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
					<select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
						{YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
					</select>
					<select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
						{MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
					</select>
					<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-dim)", marginLeft: "8px" }}>
						<input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} />
						세액 포함
					</label>
				</div>
				<button className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }} disabled={loading} onClick={handleExport}>
					<FileSpreadsheet size={14} strokeWidth={1.75} /> 엑셀로 내보내기
				</button>
			</div>

			<div className="today-summary" style={{ flexWrap: "wrap" }}>
				{SUMMARY_CARDS.map((c) => (
					<div className="summary-cell" key={c.key}>
						<div className="summary-val" style={{ color: c.color }}>{loading || !summary ? "-" : `${won(summary[c.key])}원`}</div>
						<div className="summary-key">{c.label}</div>
					</div>
				))}
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>학생</th><th>보호자</th><th>수강과목/반</th><th>수강기간</th>
								<th>청구금액</th><th>할인</th><th>실제결제액</th><th>결제일</th>
								<th>결제수단</th><th>현금영수증</th><th>증빙번호</th><th>상태</th><th>환불금액</th><th>환불일</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={14} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : records.length === 0 ? (
								<tr><td colSpan={14} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>해당 월의 결제 내역이 없습니다</td></tr>
							) : (
								records.map((r) => (
									<tr key={r.orderItemId}>
										<td style={{ fontWeight: 600 }}>{r.studentName}</td>
										<td style={{ fontSize: "12px" }}>
											{r.guardianName ? `${r.guardianName}${r.guardianPhone ? " / " + r.guardianPhone : ""}` : "-"}
										</td>
										<td>{r.programName || "-"}</td>
										<td style={{ fontSize: "12px" }}>{r.enrollStart ? `${r.enrollStart} ~ ${r.enrollEnd || ""}` : "-"}</td>
										<td style={{ fontFamily: "'DM Mono',monospace" }}>{won(r.billedAmount)}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--accent3)" }}>-{won(r.discountAmount)}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--taxacct)" }}>{won(r.paidAmount)}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
											{r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "-"}
										</td>
										<td>{r.paymentMethod ? PAYMENT_METHOD_LABEL[r.paymentMethod] : "-"}</td>
										<td>{CASH_RECEIPT_STATUS_LABEL[r.cashReceiptStatus] || "-"}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{r.receiptNumber || "-"}</td>
										<td><span className="badge" style={{ fontSize: "10px" }}>{ORDER_STATUS_LABEL[r.status] || r.status}</span></td>
										<td style={{ fontFamily: "'DM Mono',monospace" }}>{r.refundAmount ? won(r.refundAmount) : "-"}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
											{r.refundedAt ? new Date(r.refundedAt).toLocaleDateString() : "-"}
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
