import { useState, useEffect } from "react";
import {
	approveScheduleRequest, rejectScheduleRequest, approveLeaveRequest, rejectLeaveRequest, getUser
} from "../../api/common.js";
import { getCurrentUser } from "../../api/http.js";
import ApprovalRequestsTable from "../../components/ApprovalRequestsTable.jsx";

const KIND_LABEL = { SCHEDULE_CHANGE: "일정 변경", LEAVE: "휴가" };

function formatDateTime(iso) {
	if (!iso) return "-";
	return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function OwnerApprovalView({ requests, onDecided }) {
	const [filter, setFilter] = useState("all");
	const [busyId, setBusyId] = useState(null);
	const [userNames, setUserNames] = useState({});
	const [expandedId, setExpandedId] = useState(null);
	const myId = getCurrentUser()?.id;

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
	const rows = visible.map((r) => ({
		id: r.id,
		kindLabel: KIND_LABEL[r.requestType] || r.requestType,
		requesterName: userNames[r.requestedBy] || r.requestedBy,
		createdAt: r.createdAt,
		status: r.status,
		deciderName: r.decidedBy ? (userNames[r.decidedBy] || r.decidedBy) : null,
		decidedAt: r.updatedAt
	}));

	function renderDetail(id) {
		const r = visible.find((x) => x.id === id);
		if (!r) return null;
		const isLeave = r.requestType === "LEAVE";
		const isMine = r.requestedBy === myId;

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				<div style={{ fontSize: "14px", fontWeight: 700 }}>
					{isLeave ? `${r.startDate} ~ ${r.endDate} 휴가 요청` : `${r.requestedDate} 일정 변경 요청`}
				</div>

				{isLeave ? (
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
						<div style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>시작일</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.startDate}</div>
						</div>
						<div style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>종료일</div>
							<div style={{ fontSize: "13px", fontWeight: 600, color: "var(--owner)" }}>{r.endDate}</div>
						</div>
					</div>
				) : (
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
						<div style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>기존 일정</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.originalDate}</div>
						</div>
						<div style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>변경 희망</div>
							<div style={{ fontSize: "13px", fontWeight: 600, color: "var(--owner)" }}>{r.requestedDate}</div>
						</div>
					</div>
				)}

				{r.reason && (
					<div style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: "13px", color: "var(--text-sub)", lineHeight: 1.5 }}>{r.reason}</div>
				)}

				{r.status !== "PENDING" && r.decisionMemo && (
					<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
						<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
							{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
						</span>
						<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
					</div>
				)}

				<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
					신청: {userNames[r.requestedBy] || r.requestedBy} · {formatDateTime(r.createdAt)}
					{r.status !== "PENDING" && r.decidedBy && (
						<> &nbsp;|&nbsp; 처리: {userNames[r.decidedBy] || r.decidedBy} · {formatDateTime(r.updatedAt)}</>
					)}
				</div>

				{r.status === "PENDING" && (
					isMine ? (
						<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>본인이 제출한 요청은 직접 승인/반려할 수 없습니다. 다른 매니저나 오너가 처리해야 합니다.</div>
					) : (
						<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
							<button className="btn btn-sm btn-danger" disabled={busyId === r.id} onClick={() => decide(r, "reject")}>반려</button>
							<button
								className="btn btn-sm"
								disabled={busyId === r.id}
								style={{ background: "rgba(var(--green-rgb),0.15)", color: "var(--green)", border: "1px solid rgba(var(--green-rgb),0.3)" }}
								onClick={() => decide(r, "approve")}
							>
								승인
							</button>
						</div>
					)
				)}
			</div>
		);
	}

	return (
		<div id="owner-approval" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / Approval</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일정 변경 요청과 휴가 요청을 검토하고 승인하세요</div>
			</div>

			<div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
				<button className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>전체</button>
				<button className={`filter-chip ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>대기 중</button>
				<button className={`filter-chip ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>승인됨</button>
				<button className={`filter-chip ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>반려됨</button>
			</div>

			<ApprovalRequestsTable rows={rows} expandedId={expandedId} onToggle={setExpandedId} renderDetail={renderDetail} />
		</div>
	);
}
