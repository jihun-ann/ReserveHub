import { useState, useEffect } from "react";
import {
	approveScheduleRequest, rejectScheduleRequest, approveLeaveRequest, rejectLeaveRequest, hexAlpha, getUser
} from "../../api/common.js";

const STATUS_LABEL = { PENDING: "대기 중", APPROVED: "승인됨", REJECTED: "반려됨" };

function formatDateTime(iso) {
	if (!iso) return "-";
	return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function OwnerApprovalView({ requests, onDecided }) {
	const [filter, setFilter] = useState("all");
	const [busyId, setBusyId] = useState(null);
	const [userNames, setUserNames] = useState({});

	useEffect(() => {
		const ids = new Set();
		requests.forEach((r) => {
			if (r.requestedBy) ids.add(r.requestedBy);
			if (r.decidedBy) ids.add(r.decidedBy);
		});
		const unresolved = [...ids].filter((id) => !(id in userNames));
		if (unresolved.length === 0) return;
		Promise.all(unresolved.map((id) => getUser(id).then((u) => [id, u.name]).catch(() => [id, null]))).then((pairs) => {
			setUserNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requests]);

	async function decide(request, action) {
		setBusyId(request.id);
		try {
			if (request.requestType === "LEAVE") {
				await (action === "approve" ? approveLeaveRequest(request.id) : rejectLeaveRequest(request.id));
			} else {
				await (action === "approve" ? approveScheduleRequest(request.id) : rejectScheduleRequest(request.id));
			}
			onDecided();
		} catch (err) {
			alert(err.message || "처리 중 오류가 발생했습니다.");
		} finally {
			setBusyId(null);
		}
	}

	const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter.toUpperCase());

	return (
		<div id="owner-approval" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / Approval</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일정 변경 요청과 휴가 요청을 검토하고 승인하세요</div>
			</div>

			{/* 필터 */}
			<div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
				<button className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>전체</button>
				<button className={`filter-chip ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>대기 중</button>
				<button className={`filter-chip ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>승인됨</button>
				<button className={`filter-chip ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>반려됨</button>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{visible.map((r) => {
					const isLeave = r.requestType === "LEAVE";
					const requesterName = userNames[r.requestedBy] || r.requestedBy;
					const deciderName = r.decidedBy ? (userNames[r.decidedBy] || r.decidedBy) : null;
					return (
						<div
							key={r.id}
							className="card"
							style={{
								borderLeft: `3px solid ${r.status === "PENDING" ? "var(--owner)" : r.status === "APPROVED" ? "var(--green)" : "var(--red)"}`,
								opacity: r.status === "PENDING" ? 1 : 0.7
							}}
						>
							<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: r.status === "PENDING" ? "12px" : "10px", flexWrap: "wrap" }}>
								<div>
									<div style={{ fontSize: "14px", fontWeight: 700 }}>
										{isLeave ? `${r.startDate} ~ ${r.endDate} 휴가 요청` : `${r.requestedDate} 일정 변경 요청`}
									</div>
									<div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
										<span className="plat-chip" style={{ background: hexAlpha(r.platform.colorHex, 0.12), color: r.platform.colorHex, borderColor: hexAlpha(r.platform.colorHex, 0.3) }}>
											{r.platform.emoji} {r.platform.name}
										</span>
										<span className="plat-chip" style={{ background: "var(--surface2)", color: "var(--text-sub)", borderColor: "var(--border)" }}>
											{isLeave ? "휴가" : "일정 변경"}
										</span>
									</div>
								</div>
								{r.status === "PENDING" ? (
									<span className="res-status" style={{ background: "rgba(var(--owner-rgb),0.12)", color: "var(--owner)", flexShrink: 0 }}>대기 중</span>
								) : (
									<span className={`res-status ${r.status === "APPROVED" ? "rs-completed" : "rs-canceled"}`}>{STATUS_LABEL[r.status]}</span>
								)}
							</div>

							{!isLeave && r.status === "PENDING" && (
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>기존 일정</div>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.originalDate}</div>
									</div>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>변경 희망</div>
										<div style={{ fontSize: "13px", fontWeight: 600, color: "var(--owner)" }}>{r.requestedDate}</div>
									</div>
								</div>
							)}
							{!isLeave && r.status !== "PENDING" && (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace", marginBottom: "10px" }}>
									{r.originalDate} → {r.requestedDate}
								</div>
							)}

							{r.reason && (
								<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: "12px", fontSize: "13px", color: "var(--text-sub)", lineHeight: 1.5 }}>{r.reason}</div>
							)}

							<div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: r.status === "PENDING" ? "12px" : "0" }}>
								신청: {requesterName} · {formatDateTime(r.createdAt)}
								{r.status !== "PENDING" && deciderName && (
									<> &nbsp;|&nbsp; 처리: {deciderName} · {formatDateTime(r.updatedAt)}</>
								)}
							</div>

							{r.status === "PENDING" && (
								<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
									<button className="btn btn-sm btn-danger" disabled={busyId === r.id} onClick={() => decide(r, "reject")}>반려</button>
									<button
										className="btn btn-sm"
										disabled={busyId === r.id}
										style={{ background: "rgba(74,222,128,0.15)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.3)" }}
										onClick={() => decide(r, "approve")}
									>
										승인
									</button>
								</div>
							)}
						</div>
					);
				})}
				{visible.length === 0 && (
					<div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-dim)" }}>해당 조건의 요청이 없습니다</div>
				)}
			</div>
		</div>
	);
}
