import { useState, useEffect, useCallback } from "react";
import {
	listAllScheduleRequests,
	approveScheduleRequest,
	rejectScheduleRequest,
	listFinancialRequests,
	approveFinancialRequest,
	rejectFinancialRequest,
	FINANCIAL_REQUEST_TYPE_LABEL
} from "../../api/common.js";
import FinancialRequestThread from "../../components/FinancialRequestThread.jsx";

const STATUS_LABEL = {
	PENDING: { lbl: "대기 중", color: "var(--accent3)" },
	APPROVED: { lbl: "승인됨", color: "var(--green)" },
	REJECTED: { lbl: "반려됨", color: "var(--red)" }
};

export default function ManagerApprovalView({ platformId }) {
	const [requests, setRequests] = useState([]);
	const [financialRequests, setFinancialRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("ALL");
	const [kindFilter, setKindFilter] = useState("ALL");
	const [memoById, setMemoById] = useState({});
	const [expandedId, setExpandedId] = useState(null);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setRequests([]);
			setFinancialRequests([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [scheduleData, financialData] = await Promise.all([
			listAllScheduleRequests([{ id: platformId }]),
			listFinancialRequests(platformId)
		]);
		setRequests(scheduleData);
		setFinancialRequests(financialData);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function decide(id, approve) {
		const memo = memoById[id];
		if (approve) await approveScheduleRequest(id, memo);
		else await rejectScheduleRequest(id, memo);
		await refresh();
	}

	async function decideFinancial(id, approve) {
		const memo = memoById[id];
		if (approve) await approveFinancialRequest(id, memo);
		else await rejectFinancialRequest(id, memo);
		await refresh();
	}

	const merged = [
		...requests.map((r) => ({ ...r, kind: "SCHEDULE" })),
		...financialRequests.map((r) => ({ ...r, kind: "FINANCIAL" }))
	];
	const data = merged
		.filter((r) => filter === "ALL" || r.status === filter)
		.filter((r) => kindFilter === "ALL" || r.kind === kindFilter);

	return (
		<div className="page" id="manager-approval">
			<div className="page-header">
				<div className="page-label">APPROVAL</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일정 변경 요청을 검토하고 처리하세요</div>
			</div>

			<div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
				{[
					{ v: "ALL", lbl: "전체 유형" },
					{ v: "SCHEDULE", lbl: "일정 변경" },
					{ v: "FINANCIAL", lbl: "재무 일정" }
				].map((k) => (
					<button
						key={k.v}
						className={`filter-chip ${kindFilter === k.v ? "active" : ""}`}
						onClick={() => setKindFilter(k.v)}
					>
						{k.lbl}
					</button>
				))}
			</div>

			<div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
				{["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
					<button
						key={s}
						className={`filter-chip ${filter === s ? "active" : ""}`}
						onClick={() => setFilter(s)}
					>
						{s === "ALL" ? "전체" : STATUS_LABEL[s].lbl}
					</button>
				))}
			</div>

			{loading ? (
				<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : data.length === 0 ? (
				<div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-dim)" }}>
					해당 조건의 요청이 없습니다
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{data.map((r) => {
						const st = STATUS_LABEL[r.status];
						const isFinancial = r.kind === "FINANCIAL";
						const onDecide = isFinancial ? decideFinancial : decide;
						return (
							<div key={`${r.kind}-${r.id}`} className="req-card" style={{ borderLeftColor: st.color }}>
								<div className="req-header">
									<div>
										<div className="req-title">
											{isFinancial ? `재무 일정 · ${FINANCIAL_REQUEST_TYPE_LABEL[r.type] || r.type}` : "일정 변경 요청"}
										</div>
										<div className="req-meta">
											{isFinancial ? r.title : `요청 사유: ${r.reason || "-"}`}
										</div>
									</div>
									<span className="badge" style={{ color: st.color }}>{st.lbl}</span>
								</div>
								{isFinancial ? (
									<div className="req-date-row">
										<div className="req-date-box">
											<div className="req-date-lbl">해당 일자</div>
											<div className="req-date-val" style={{ color: "var(--manager)" }}>{r.eventDate}</div>
										</div>
										{r.memo && (
											<div className="req-date-box">
												<div className="req-date-lbl">세무사 메모</div>
												<div className="req-date-val">{r.memo}</div>
											</div>
										)}
									</div>
								) : (
									<div className="req-date-row">
										<div className="req-date-box">
											<div className="req-date-lbl">기존 일정</div>
											<div className="req-date-val">{r.originalDate}</div>
										</div>
										<div className="req-date-box">
											<div className="req-date-lbl">변경 희망</div>
											<div className="req-date-val" style={{ color: "var(--manager)" }}>{r.requestedDate}</div>
										</div>
									</div>
								)}
								{r.status !== "PENDING" && r.decisionMemo && (
									<div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-sub)" }}>
										<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
											{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
										</span>
										<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
									</div>
								)}
								{isFinancial && (
									<>
										<button
											type="button"
											className="btn btn-ghost btn-sm"
											style={{ marginTop: "10px" }}
											onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
										>
											{expandedId === r.id ? "댓글 닫기" : "댓글 / 파일 첨부"}
										</button>
										{expandedId === r.id && <FinancialRequestThread requestId={r.id} />}
									</>
								)}
								{r.status === "PENDING" && (
									<div style={{ marginTop: "10px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginBottom: "5px" }}>
											처리 메모
										</div>
										<textarea
											className="req-memo"
											placeholder="처리 사유나 특이사항을 입력하세요..."
											value={memoById[r.id] || ""}
											onChange={(e) => setMemoById((prev) => ({ ...prev, [r.id]: e.target.value }))}
										/>
										<div className="req-footer">
											<div />
											<div style={{ display: "flex", gap: "8px" }}>
												<button className="btn btn-danger btn-sm" onClick={() => onDecide(r.id, false)}>반려</button>
												<button
													className="btn btn-sm"
													style={{ background: "rgba(74,222,128,.15)", color: "var(--green)", border: "1px solid rgba(74,222,128,.3)" }}
													onClick={() => onDecide(r.id, true)}
												>
													승인
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
