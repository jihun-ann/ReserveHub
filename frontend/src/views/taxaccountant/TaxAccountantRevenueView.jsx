import { useState, useEffect, useCallback } from "react";
import { listOrders } from "../../api/common.js";
import { exportCsv } from "../../utils/exportCsv.js";

const today0 = new Date();
const YEARS = [today0.getFullYear(), today0.getFullYear() - 1, today0.getFullYear() - 2];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

function won(n) {
	return n.toLocaleString("ko-KR");
}

export default function TaxAccountantRevenueView({ platformId, platformName }) {
	const [year, setYear] = useState(today0.getFullYear());
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setOrders([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const all = await listOrders(platformId);
		setOrders(all.filter((o) => o.status === "PAID" && o.paidAt?.slice(0, 4) === String(year)));
		setLoading(false);
	}, [platformId, year]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// 월별 매출/건수 집계 — 결제 완료(PAID) 주문만 대상으로 한다.
	const byMonth = Array.from({ length: 12 }, (_, i) => {
		const monthOrders = orders.filter((o) => Number(o.paidAt.slice(5, 7)) === i + 1);
		return {
			month: i + 1,
			revenue: monthOrders.reduce((sum, o) => sum + o.finalAmount, 0),
			count: monthOrders.length
		};
	});

	const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
	const totalCount = orders.length;
	const avgOrder = totalCount === 0 ? 0 : Math.round(totalRevenue / totalCount);

	const selectStyle = {
		padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)",
		borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none"
	};

	function handleExport() {
		exportCsv(
			`매출집계_${platformName || "플랫폼"}_${year}.csv`,
			["월", "매출", "결제 건수"],
			byMonth.map((m) => [MONTH_LABELS[m.month - 1], m.revenue, m.count])
		);
	}

	return (
		<div className="page" id="taxacct-revenue">
			<div className="page-header">
				<div className="page-label">Tax Accountant / Revenue</div>
				<div className="page-title">매출 집계</div>
				<div className="page-subtitle">{platformName ? `${platformName}의 ` : ""}월별 결제 매출을 확인하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
				<select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
					{YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
				</select>
				<button className="btn btn-ghost btn-sm" disabled={loading} onClick={handleExport}>
					📊 엑셀로 내보내기
				</button>
			</div>

			<div className="today-summary">
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--taxacct)" }}>{loading ? "-" : `${won(totalRevenue)}원`}</div>
					<div className="summary-key">연간 총 매출</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : totalCount}</div>
					<div className="summary-key">총 결제 건수</div>
				</div>
				<div className="summary-cell">
					<div className="summary-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : `${won(avgOrder)}원`}</div>
					<div className="summary-key">건당 평균 결제액</div>
				</div>
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>월</th><th>매출</th><th>결제 건수</th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : (
								byMonth.map((m) => (
									<tr key={m.month}>
										<td>{MONTH_LABELS[m.month - 1]}</td>
										<td style={{ fontFamily: "'DM Mono',monospace" }}>{won(m.revenue)}원</td>
										<td style={{ fontFamily: "'DM Mono',monospace" }}>{m.count}건</td>
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
