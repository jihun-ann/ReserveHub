import { useState, useEffect, useCallback } from "react";
import { listAllScheduleRequests, approveScheduleRequest, rejectScheduleRequest } from "../../api/common.js";

const STATUS_LABEL = {
	PENDING: { lbl: "대기 중", color: "var(--accent3)" },
	APPROVED: { lbl: "승인됨", color: "var(--green)" },
	REJECTED: { lbl: "반려됨", color: "var(--red)" }
};

export default function ManagerApprovalView({ platformId }) {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("ALL");
	const [memoById, setMemoById] = useState({});

	const refresh = useCallback(async () => {
		if (!platformId) {
			setRequests([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setRequests(await listAllScheduleRequests([{ id: platformId }]));
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

	const data = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

	return (
		<div className="page" id="manager-approval">
			<div className="page-header">
				<div className="page-label">APPROVAL</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일정 변경 요청을 검토하고 처리하세요</div>
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
						return (
							<div key={r.id} className="req-card" style={{ borderLeftColor: st.color }}>
								<div className="req-header">
									<div>
										<div className="req-title">일정 변경 요청</div>
										<div className="req-meta">요청 사유: {r.reason || "-"}</div>
									</div>
									<span className="badge" style={{ color: st.color }}>{st.lbl}</span>
								</div>
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
								{r.status !== "PENDING" && r.decisionMemo && (
									<div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-sub)" }}>
										<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
											{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
										</span>
										<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
									</div>
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
												<button className="btn btn-danger btn-sm" onClick={() => decide(r.id, false)}>반려</button>
												<button
													className="btn btn-sm"
													style={{ background: "rgba(74,222,128,.15)", color: "var(--green)", border: "1px solid rgba(74,222,128,.3)" }}
													onClick={() => decide(r.id, true)}
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
