import { useState, useEffect, useCallback } from "react";
import { Palmtree } from "lucide-react";
import {
	listAllScheduleRequests,
	approveScheduleRequest,
	rejectScheduleRequest,
	listAllLeaveRequests,
	createLeaveRequest,
	approveLeaveRequest,
	rejectLeaveRequest,
	listFinancialRequests,
	approveFinancialRequest,
	rejectFinancialRequest,
	FINANCIAL_REQUEST_TYPE_LABEL,
	getUser,
	getMyPermissions
} from "../../api/common.js";
import { getCurrentUser } from "../../api/http.js";
import { openModal, closeModal } from "../default.js";
import FinancialRequestThread from "../../components/FinancialRequestThread.jsx";
import ApprovalRequestsTable from "../../components/ApprovalRequestsTable.jsx";

const STATUS_LABEL = { PENDING: "대기 중", APPROVED: "승인됨", REJECTED: "반려됨" };
const KIND_LABEL = { SCHEDULE: "일정 변경", LEAVE: "휴가", FINANCIAL: "재무 일정" };

function formatDateTime(iso) {
	if (!iso) return "-";
	return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ManagerApprovalView({ platformId }) {
	const [requests, setRequests] = useState([]);
	const [leaveRequests, setLeaveRequests] = useState([]);
	const [financialRequests, setFinancialRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("ALL");
	const [kindFilter, setKindFilter] = useState("ALL");
	const [memoById, setMemoById] = useState({});
	const [expandedId, setExpandedId] = useState(null);
	const [openThreadId, setOpenThreadId] = useState(null);
	const [userNames, setUserNames] = useState({});
	const [myPermissions, setMyPermissions] = useState([]);
	const myId = getCurrentUser()?.id;

	useEffect(() => {
		if (!platformId || !myId) return;
		getMyPermissions(platformId).then(setMyPermissions).catch(() => setMyPermissions([]));
	}, [platformId, myId]);

	const [leaveStart, setLeaveStart] = useState("");
	const [leaveEnd, setLeaveEnd] = useState("");
	const [leaveReason, setLeaveReason] = useState("");
	const [leaveSubmitting, setLeaveSubmitting] = useState(false);
	const [leaveError, setLeaveError] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setRequests([]);
			setLeaveRequests([]);
			setFinancialRequests([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [scheduleData, leaveData, financialData] = await Promise.all([
			listAllScheduleRequests([{ id: platformId }]),
			listAllLeaveRequests([{ id: platformId }]),
			listFinancialRequests(platformId)
		]);
		setRequests(scheduleData);
		setLeaveRequests(leaveData);
		setFinancialRequests(financialData);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function openLeaveModal() {
		setLeaveStart("");
		setLeaveEnd("");
		setLeaveReason("");
		setLeaveError("");
		openModal("managerLeaveRequestModal");
	}

	async function submitLeave() {
		setLeaveError("");
		if (!leaveStart || !leaveEnd) return;
		setLeaveSubmitting(true);
		try {
			await createLeaveRequest(platformId, { startDate: leaveStart, endDate: leaveEnd, reason: leaveReason.trim() || null });
			closeModal("managerLeaveRequestModal");
			await refresh();
		} catch (err) {
			setLeaveError(err.message || "요청 제출에 실패했습니다.");
		} finally {
			setLeaveSubmitting(false);
		}
	}

	async function decide(id, approve) {
		const memo = memoById[id];
		if (approve) await approveScheduleRequest(id, memo);
		else await rejectScheduleRequest(id, memo);
		await refresh();
	}

	async function decideLeave(id, approve) {
		const memo = memoById[id];
		if (approve) await approveLeaveRequest(id, memo);
		else await rejectLeaveRequest(id, memo);
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
		...leaveRequests.map((r) => ({ ...r, kind: "LEAVE" })),
		...financialRequests.map((r) => ({ ...r, kind: "FINANCIAL" }))
	];

	useEffect(() => {
		const ids = new Set();
		merged.forEach((r) => {
			if (r.requestedBy) ids.add(r.requestedBy);
			if (r.decidedBy) ids.add(r.decidedBy);
		});
		const unresolved = [...ids].filter((id) => !(id in userNames));
		if (unresolved.length === 0) return;
		Promise.all(unresolved.map((id) => getUser(id).then((u) => [id, u.name]).catch(() => [id, null]))).then((pairs) => {
			setUserNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requests, leaveRequests, financialRequests]);

	const data = merged
		.filter((r) => filter === "ALL" || r.status === filter)
		.filter((r) => kindFilter === "ALL" || r.kind === kindFilter);

	const rows = data.map((r) => ({
		id: `${r.kind}-${r.id}`,
		kindLabel: KIND_LABEL[r.kind],
		requesterName: userNames[r.requestedBy] || r.requestedBy,
		createdAt: r.createdAt,
		status: r.status,
		deciderName: r.decidedBy ? (userNames[r.decidedBy] || r.decidedBy) : null,
		decidedAt: r.updatedAt
	}));

	function renderDetail(rowId) {
		const r = merged.find((x) => `${x.kind}-${x.id}` === rowId);
		if (!r) return null;
		const st = STATUS_LABEL[r.status];
		const statusColor = r.status === "APPROVED" ? "var(--green)" : r.status === "REJECTED" ? "var(--red)" : "var(--text-dim)";
		const isFinancial = r.kind === "FINANCIAL";
		const isLeave = r.kind === "LEAVE";
		const onDecide = isFinancial ? decideFinancial : isLeave ? decideLeave : decide;
		const isMine = r.requestedBy === myId;
		// 휴가 승인/반려(LeaveRequestService)와 재무 일정 승인/반려(FinancialRequestService)는
		// 백엔드가 HIGH 등급 매니저만 허용한다 — 일정 변경(SCHEDULE)은 등급 무관.
		const tierBlocked = (isLeave && !myPermissions.includes("LEAVE_APPROVE")) || (isFinancial && !myPermissions.includes("FINANCIAL_APPROVE"));

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
					<div style={{ fontSize: "14px", fontWeight: 700 }}>
						{isFinancial ? `재무 일정 · ${FINANCIAL_REQUEST_TYPE_LABEL[r.type] || r.type}` : isLeave ? "휴가 요청" : "일정 변경 요청"}
					</div>
					<span className="badge" style={{ color: statusColor }}>{st}</span>
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
				) : isLeave ? (
					<div className="req-date-row">
						<div className="req-date-box">
							<div className="req-date-lbl">시작일</div>
							<div className="req-date-val">{r.startDate}</div>
						</div>
						<div className="req-date-box">
							<div className="req-date-lbl">종료일</div>
							<div className="req-date-val" style={{ color: "var(--manager)" }}>{r.endDate}</div>
						</div>
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

				{!isFinancial && r.reason && (
					<div style={{ fontSize: "13px", color: "var(--text-sub)" }}>사유: {r.reason}</div>
				)}

				{!isFinancial && (
					<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
						신청: {userNames[r.requestedBy] || r.requestedBy} · {formatDateTime(r.createdAt)}
						{r.status !== "PENDING" && r.decidedBy && (
							<> &nbsp;|&nbsp; 처리: {userNames[r.decidedBy] || r.decidedBy} · {formatDateTime(r.updatedAt)}</>
						)}
					</div>
				)}

				{r.status !== "PENDING" && r.decisionMemo && (
					<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
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
							style={{ alignSelf: "flex-start" }}
							onClick={() => setOpenThreadId(openThreadId === r.id ? null : r.id)}
						>
							{openThreadId === r.id ? "댓글 닫기" : "댓글 / 파일 첨부"}
						</button>
						{openThreadId === r.id && <FinancialRequestThread requestId={r.id} />}
					</>
				)}

				{r.status === "PENDING" && (
					isMine ? (
						<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>본인이 제출한 요청은 직접 승인/반려할 수 없습니다. 다른 매니저나 오너가 처리해야 합니다.</div>
					) : tierBlocked ? (
						<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
							{isFinancial ? "재무 일정" : "휴가"} 승인/반려는 H 등급 매니저만 처리할 수 있습니다.
						</div>
					) : (
						<div>
							<div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginBottom: "5px" }}>처리 메모</div>
							<textarea
								className="req-memo"
								placeholder="처리 사유나 특이사항을 입력하세요..."
								value={memoById[r.id] || ""}
								onChange={(e) => setMemoById((prev) => ({ ...prev, [r.id]: e.target.value }))}
							/>
							<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
								<button className="btn btn-danger btn-sm" onClick={() => onDecide(r.id, false)}>반려</button>
								<button
									className="btn btn-sm"
									style={{ background: "rgba(var(--green-rgb),.15)", color: "var(--green)", border: "1px solid rgba(var(--green-rgb),.3)" }}
									onClick={() => onDecide(r.id, true)}
								>
									승인
								</button>
							</div>
						</div>
					)
				)}
			</div>
		);
	}

	return (
		<>
		<div className="page" id="manager-approval">
			<div className="page-header">
				<div className="page-label">APPROVAL</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일정 변경/휴가/재무 일정 요청을 검토하고 처리하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
				<button className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }} onClick={openLeaveModal}><Palmtree size={14} strokeWidth={1.75} /> + 휴가 요청</button>
			</div>

			<div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
				{[
					{ v: "ALL", lbl: "전체 유형" },
					{ v: "SCHEDULE", lbl: "일정 변경" },
					{ v: "LEAVE", lbl: "휴가" },
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
						{s === "ALL" ? "전체" : STATUS_LABEL[s]}
					</button>
				))}
			</div>

			{loading ? (
				<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : (
				<ApprovalRequestsTable rows={rows} expandedId={expandedId} onToggle={setExpandedId} renderDetail={renderDetail} />
			)}
		</div>

		<div className="modal-overlay" id="managerLeaveRequestModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">휴가 요청</div>
					<button className="modal-close" onClick={() => closeModal("managerLeaveRequestModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
						<div className="form-field">
							<label>시작일</label>
							<input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
						</div>
						<div className="form-field">
							<label>종료일</label>
							<input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
						</div>
					</div>
					<div className="form-field">
						<label>사유 (선택)</label>
						<textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="휴가 사유를 작성해주세요..."></textarea>
					</div>
					{leaveError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{leaveError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("managerLeaveRequestModal")}>취소</button>
						<button className="btn btn-primary" disabled={leaveSubmitting || !leaveStart || !leaveEnd} onClick={submitLeave}>
							{leaveSubmitting ? "제출 중..." : "휴가 요청 제출"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
