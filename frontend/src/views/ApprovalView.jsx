import { useState, useEffect, useCallback, Fragment } from "react";
import {
	listWorkRequests, listWorkRequestAssignees, createWorkRequest, changeWorkRequestStatus, WORK_REQUEST_STATUS_LABEL,
	listAllScheduleRequests, listMyScheduleRequests, approveScheduleRequest, rejectScheduleRequest,
	listAllLeaveRequests, listMyLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest,
	listMySlots, getMyPermissions, getUser
} from "../api/common.js";
import { getCurrentUser } from "../api/http.js";
import { openModal, closeModal } from "./default.js";
import WorkRequestThread from "../components/WorkRequestThread.jsx";
import ScheduleChangeForm from "../components/ScheduleChangeForm.jsx";
import { formatDateTime } from "../utils/formatDateTime.js";

// 결재 — 오너·매니저·세무사는 결재함(내가 처리할 것)과 내 신청을, 강사는 내 신청만 본다.
// 업무 요청(담당자가 진행 중 → 완료), 휴가·일정 변경(오너/매니저가 승인 → 반려)을 한 표에 모은다.
const OFFICE_ROLES = ["OWNER", "MANAGER", "TAX_ACCOUNTANT"];
const APPROVER_ROLES = ["OWNER", "MANAGER"];
const KIND_LABEL = { WORK: "업무 요청", LEAVE: "휴가", SCHEDULE: "일정 변경" };
const APPROVAL_STATUS_LABEL = { PENDING: "대기 중", APPROVED: "승인됨", REJECTED: "반려됨" };
const OPEN_STATUSES = ["PENDING", "REQUESTED", "IN_PROGRESS"];
const MODAL_ID = "approvalSubmitModal";
const EMPTY_QUERY = { text: "", kind: "", from: "", to: "" };

function statusColor(status) {
	if (status === "APPROVED" || status === "DONE") return "var(--green)";
	if (status === "REJECTED") return "var(--red)";
	if (status === "CANCELED") return "var(--text-dim)";
	return "var(--accent3)";
}

// 신청 종류 — 역할마다 고를 수 있는 것이 다르다. 일정 변경은 내가 담당하는 수업이 있을 때만.
function categoriesFor(role, hasSlots) {
	const list = [];
	if (OFFICE_ROLES.includes(role)) list.push("WORK");
	if (role === "MANAGER" || role === "TUTOR") list.push("LEAVE");
	if (hasSlots && role !== "TAX_ACCOUNTANT") list.push("SCHEDULE");
	return list;
}

export default function ApprovalView({ platformId, role }) {
	const myId = getCurrentUser()?.id;
	const isOffice = OFFICE_ROLES.includes(role);
	const isApprover = APPROVER_ROLES.includes(role);

	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState(isOffice ? "inbox" : "mine"); // inbox | mine | all
	// draft는 입력 중인 조건, query는 검색 버튼(또는 Enter)으로 적용된 조건.
	const [draft, setDraft] = useState(EMPTY_QUERY);
	const [query, setQuery] = useState(EMPTY_QUERY);
	const [statusFilter, setStatusFilter] = useState("open"); // open | closed | all
	const [expandedId, setExpandedId] = useState(null);
	const [names, setNames] = useState({});
	const [assignees, setAssignees] = useState([]);
	const [permissions, setPermissions] = useState([]);
	const [mySlots, setMySlots] = useState([]);
	const [memoById, setMemoById] = useState({});
	const [category, setCategory] = useState(null);

	// 상태는 응답이 온 뒤에만 바꾼다(effect 안에서 바로 setState 하지 않도록).
	const load = useCallback(async () => {
		if (!platformId) return [];
		const here = (r) => r.platformId === platformId;
		// 내 신청은 항상 따로 불러온다 — 결재함 권한(MENU_APPROVAL)이 없는 매니저는 전체 목록 조회가 막히기 때문.
		const [work, allSchedules, mySchedules, allLeaves, myLeaves] = await Promise.all([
			isOffice ? listWorkRequests(platformId).catch(() => []) : [],
			isApprover ? listAllScheduleRequests([{ id: platformId }]).catch(() => []) : [],
			listMyScheduleRequests().then((l) => l.filter(here)).catch(() => []),
			isApprover ? listAllLeaveRequests([{ id: platformId }]).catch(() => []) : [],
			listMyLeaveRequests().then((l) => l.filter(here)).catch(() => [])
		]);
		const unique = (list) => [...new Map(list.map((r) => [r.id, r])).values()];
		return [
			...work.map((r) => ({ ...r, kind: "WORK" })),
			...unique([...allSchedules, ...mySchedules]).map((r) => ({ ...r, kind: "SCHEDULE" })),
			...unique([...allLeaves, ...myLeaves]).map((r) => ({ ...r, kind: "LEAVE" }))
		].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
	}, [platformId, isOffice, isApprover]);

	const refresh = useCallback(() => load().then(setItems), [load]);

	useEffect(() => {
		load().then(setItems).finally(() => setLoading(false));
	}, [load]);

	useEffect(() => {
		if (!platformId) return;
		listMySlots().then((l) => setMySlots(l.filter((s) => s.platformId === platformId))).catch(() => setMySlots([]));
		if (isApprover) getMyPermissions(platformId).then(setPermissions).catch(() => setPermissions([]));
		if (isOffice) {
			listWorkRequestAssignees(platformId).then((list) => {
				setAssignees(list);
				setNames((prev) => ({ ...prev, ...Object.fromEntries(list.map((a) => [a.userId, a.name])) }));
			}).catch(() => setAssignees([]));
		}
	}, [platformId, isOffice, isApprover]);

	// 휴가·일정 변경 신청자(강사 등)는 담당자 목록에 없으니 따로 이름을 찾는다.
	useEffect(() => {
		const missing = [...new Set(items.flatMap((r) => [r.requestedBy, r.decidedBy]).filter(Boolean))].filter((id) => !(id in names));
		if (missing.length === 0) return;
		Promise.all(missing.map((id) => getUser(id).then((u) => [id, u.name]).catch(() => [id, null]))).then((pairs) => {
			setNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
		});
	}, [items, names]);

	const nameOf = (id) => (id === myId ? "나" : names[id] || "-");

	// 결재함: 내가 담당인 업무 요청 + (오너/매니저면) 다른 사람이 올린 휴가·일정 변경. 내 신청: 내가 올린 것 전부.
	const inInbox = (r) => (r.kind === "WORK" ? r.assigneeId === myId : isApprover && r.requestedBy !== myId);
	const summaryOf = (r) => (r.kind === "WORK" ? r.title : r.kind === "LEAVE" ? `${r.startDate} ~ ${r.endDate}` : `${r.originalDate} → ${r.requestedDate}`);
	const handlerOf = (r) => (r.kind === "WORK" ? r.assigneeId : r.decidedBy);
	// 조회 조건 — 검색어는 내용·사유·메모·요청자·담당자 이름, 기간은 등록일 기준.
	const term = query.text.trim().toLowerCase();
	const matches = (r) =>
		(!query.kind || r.kind === query.kind) &&
		(!query.from || r.createdAt?.slice(0, 10) >= query.from) &&
		(!query.to || r.createdAt?.slice(0, 10) <= query.to) &&
		(!term || [summaryOf(r), r.reason, r.memo, nameOf(r.requestedBy), nameOf(handlerOf(r))].some((v) => v?.toLowerCase().includes(term)));
	const visible = items
		.filter((r) => (tab === "all" ? true : tab === "inbox" ? inInbox(r) : r.requestedBy === myId))
		.filter((r) => statusFilter === "all" || (statusFilter === "open") === OPEN_STATUSES.includes(r.status))
		.filter(matches);
	const filtering = term || query.kind || query.from || query.to;
	const inboxOpenCount = items.filter((r) => inInbox(r) && OPEN_STATUSES.includes(r.status)).length;

	async function run(action) {
		try {
			await action();
			await refresh();
		} catch (err) {
			alert(err.message || "처리하지 못했습니다.");
		}
	}

	function openSubmit() {
		setCategory(null);
		openModal(MODAL_ID);
	}

	function submitted() {
		closeModal(MODAL_ID);
		setCategory(null);
		setTab("mine");
		setStatusFilter("open");
		refresh();
	}

	function renderDetail(r) {
		if (r.kind === "WORK") {
			const isAssignee = r.assigneeId === myId;
			const isRequester = r.requestedBy === myId;
			const open = OPEN_STATUSES.includes(r.status);
			return (
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "var(--text-sub)", flexWrap: "wrap" }}>
						<span>요청 {nameOf(r.requestedBy)}</span>
						<span>담당 {nameOf(r.assigneeId)}</span>
						{r.dueDate && <span style={{ fontFamily: "var(--mono)" }}>기한 {r.dueDate}</span>}
					</div>
					{r.memo && <div style={{ fontSize: "13px", whiteSpace: "pre-wrap" }}>{r.memo}</div>}
					{open && (isAssignee || isRequester) && (
						<div style={{ display: "flex", gap: "8px" }}>
							{isAssignee && r.status === "REQUESTED" && (
								<button className="btn btn-ghost btn-sm" onClick={() => run(() => changeWorkRequestStatus(r.id, "IN_PROGRESS"))}>진행 중으로</button>
							)}
							{isAssignee && <button className="btn btn-primary btn-sm" onClick={() => run(() => changeWorkRequestStatus(r.id, "DONE"))}>완료</button>}
							{isRequester && (
								<button className="btn btn-danger btn-sm" onClick={() => window.confirm("이 업무 요청을 취소할까요?") && run(() => changeWorkRequestStatus(r.id, "CANCELED"))}>
									요청 취소
								</button>
							)}
						</div>
					)}
					<WorkRequestThread requestId={r.id} />
				</div>
			);
		}

		const isLeave = r.kind === "LEAVE";
		const permission = isLeave ? "LEAVE_APPROVE" : "MENU_APPROVAL";
		const canDecide = isApprover && r.status === "PENDING" && r.requestedBy !== myId && permissions.includes(permission);
		const decide = (approve) => {
			const memo = memoById[r.id];
			const call = isLeave ? (approve ? approveLeaveRequest : rejectLeaveRequest) : (approve ? approveScheduleRequest : rejectScheduleRequest);
			run(() => call(r.id, memo));
		};
		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				<div style={{ display: "flex", gap: "24px", fontSize: "13px", fontFamily: "var(--mono)" }}>
					{isLeave ? <span>{r.startDate} ~ {r.endDate}</span> : <span>{r.originalDate} → {r.requestedDate}</span>}
				</div>
				{r.reason && <div style={{ fontSize: "13px", color: "var(--text-sub)" }}>사유: {r.reason}</div>}
				{r.status !== "PENDING" && (
					<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
						{APPROVAL_STATUS_LABEL[r.status]} · {nameOf(r.decidedBy)} · {formatDateTime(r.updatedAt)}
						{r.decisionMemo && <div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>}
					</div>
				)}
				{r.status === "PENDING" && isApprover && r.requestedBy === myId && (
					<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>본인이 올린 결재는 다른 매니저나 오너가 처리합니다</div>
				)}
				{r.status === "PENDING" && isApprover && r.requestedBy !== myId && !canDecide && (
					<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>{isLeave ? "휴가" : "일정 변경"} 승인 권한이 있는 그룹만 처리할 수 있습니다</div>
				)}
				{canDecide && (
					<div className="form-field">
						<textarea
							placeholder="처리 메모 (선택)"
							value={memoById[r.id] || ""}
							onChange={(e) => setMemoById((prev) => ({ ...prev, [r.id]: e.target.value }))}
						/>
						<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
							<button className="btn btn-danger btn-sm" onClick={() => decide(false)}>반려</button>
							<button className="btn btn-primary btn-sm" onClick={() => decide(true)}>승인</button>
						</div>
					</div>
				)}
			</div>
		);
	}

	const categories = categoriesFor(role, mySlots.length > 0);

	return (
		<>
			<div className="page" id="approval">
				<div className="page-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
					<div>
						<div className="page-title">결재</div>
						<div className="page-subtitle">{isOffice ? "업무 요청, 휴가, 일정 변경" : "휴가와 일정 변경 신청"}</div>
					</div>
					{categories.length > 0 && <button className="btn btn-primary" onClick={openSubmit}>결재 신청</button>}
				</div>

				<div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
					{isOffice && (
						<div className="seg">
							<button className={tab === "inbox" ? "active" : ""} onClick={() => setTab("inbox")}>
								결재함{inboxOpenCount > 0 && <span className="seg-count">{inboxOpenCount}</span>}
							</button>
							<button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>내 신청</button>
							<button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>전체 조회</button>
						</div>
					)}
					<div className="seg">
						{[["open", "진행 중"], ["closed", "끝남"], ["all", "전체"]].map(([k, label]) => (
							<button key={k} className={statusFilter === k ? "active" : ""} onClick={() => setStatusFilter(k)}>{label}</button>
						))}
					</div>
				</div>

				<form className="approval-query" onSubmit={(e) => { e.preventDefault(); setQuery(draft); }}>
					<input type="search" placeholder="내용, 이름으로 검색" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
					<select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
						<option value="">모든 유형</option>
						{Object.entries(KIND_LABEL).filter(([k]) => isOffice || k !== "WORK").map(([k, label]) => <option key={k} value={k}>{label}</option>)}
					</select>
					<input type="date" aria-label="등록일 시작" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
					<span style={{ color: "var(--text-dim)" }}>~</span>
					<input type="date" aria-label="등록일 끝" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
					<button type="submit" className="btn btn-ghost btn-sm">검색</button>
					{filtering && (
						<button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDraft(EMPTY_QUERY); setQuery(EMPTY_QUERY); }}>초기화</button>
					)}
					<span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{visible.length}건</span>
				</form>

				{loading ? (
					<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)", fontSize: "13px" }}>불러오는 중</div>
				) : (
					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ overflowX: "auto" }}>
							<table className="data-table">
								<thead>
									<tr><th>유형</th><th>내용</th><th>요청</th><th>담당</th><th>상태</th><th>등록</th></tr>
								</thead>
								<tbody>
									{visible.length === 0 && (
										<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
											{filtering ? "조건에 맞는 결재가 없습니다" : tab === "inbox" ? "처리할 결재가 없습니다" : tab === "mine" ? "올린 결재가 없습니다" : "결재가 없습니다"}
										</td></tr>
									)}
									{visible.map((r) => {
										const key = `${r.kind}-${r.id}`;
										const open = expandedId === key;
										const label = r.kind === "WORK" ? WORK_REQUEST_STATUS_LABEL[r.status] : APPROVAL_STATUS_LABEL[r.status];
										const summary = summaryOf(r);
										return (
											<Fragment key={key}>
												<tr onClick={() => setExpandedId(open ? null : key)} style={{ cursor: "pointer", background: open ? "var(--surface2)" : undefined }}>
													<td style={{ color: "var(--text-sub)" }}>{KIND_LABEL[r.kind]}</td>
													<td style={{ fontWeight: 500 }}>{summary}</td>
													<td>{nameOf(r.requestedBy)}</td>
													<td>{r.kind === "WORK" ? nameOf(r.assigneeId) : r.decidedBy ? nameOf(r.decidedBy) : "-"}</td>
													<td>
														<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
															<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColor(r.status) }} />
															{label}
														</span>
													</td>
													<td style={{ fontSize: "12px", color: "var(--text-sub)", fontFamily: "var(--mono)" }}>{formatDateTime(r.createdAt)}</td>
												</tr>
												{open && (
													<tr><td colSpan={6} style={{ background: "var(--surface2)", padding: "16px" }}>{renderDetail(r)}</td></tr>
												)}
											</Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>

			<div className="modal-overlay" id={MODAL_ID}>
				<div className="modal-box" style={{ width: "min(520px, 92vw)" }}>
					<div className="modal-header">
						<div className="modal-title">{category ? `${KIND_LABEL[category]} 신청` : "결재 신청"}</div>
						<button className="modal-close" onClick={() => closeModal(MODAL_ID)}>✕</button>
					</div>
					{!category && (
						<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
							{categories.map((c) => (
								<button key={c} className="btn btn-ghost" style={{ textAlign: "left", padding: "12px 16px" }} onClick={() => setCategory(c)}>
									<div style={{ fontWeight: 500, color: "var(--text)" }}>{KIND_LABEL[c]}</div>
									<div style={{ fontSize: "12px", marginTop: "2px" }}>
										{c === "WORK" ? "담당자를 정해 일을 맡기고 댓글로 주고받기" : c === "LEAVE" ? "휴가 기간을 올려 승인받기" : "내 수업의 회차를 다른 날로 옮기기"}
									</div>
								</button>
							))}
						</div>
					)}
					{category === "WORK" && (
						<WorkRequestForm platformId={platformId} assignees={assignees} myId={myId} onSubmitted={submitted} onCancel={() => setCategory(null)} />
					)}
					{category === "LEAVE" && <LeaveForm platformId={platformId} onSubmitted={submitted} onCancel={() => setCategory(null)} />}
					{category === "SCHEDULE" && <ScheduleChangeForm slots={mySlots} onSubmitted={submitted} onCancel={() => setCategory(null)} />}
				</div>
			</div>
		</>
	);
}

function WorkRequestForm({ platformId, assignees, myId, onSubmitted, onCancel }) {
	const [form, setForm] = useState({ title: "", assigneeId: "", dueDate: "", memo: "" });
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	// 담당자를 안 고르면 나 아닌 첫 사람에게 — 혼자 운영하는 곳이면 나에게(개인 할 일).
	const assigneeId = form.assigneeId || assignees.find((a) => a.userId !== myId)?.userId || myId;
	const ROLE = { OWNER: "오너", MANAGER: "매니저", TAX_ACCOUNTANT: "세무사" };

	async function submit(e) {
		e.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			await createWorkRequest(platformId, { ...form, title: form.title.trim(), assigneeId });
			onSubmitted();
		} catch (err) {
			setError(err.message || "신청에 실패했습니다.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div className="form-field">
				<label>제목</label>
				<input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 10월 매출 명세서 보내주세요" />
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
				<div className="form-field">
					<label>담당자</label>
					<select value={assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
						{assignees.map((a) => (
							<option key={a.userId} value={a.userId}>{a.userId === myId ? "나" : a.name} · {ROLE[a.role]}</option>
						))}
					</select>
				</div>
				<div className="form-field">
					<label>기한 (선택)</label>
					<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
				</div>
			</div>
			<div className="form-field">
				<label>메모 (선택)</label>
				<textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="필요한 자료, 참고할 내용" />
			</div>
			{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button type="button" className="btn btn-ghost" onClick={onCancel}>뒤로</button>
				<button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim()}>{submitting ? "신청 중" : "신청"}</button>
			</div>
		</form>
	);
}

function LeaveForm({ platformId, onSubmitted, onCancel }) {
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function submit() {
		setError("");
		setSubmitting(true);
		try {
			await createLeaveRequest(platformId, { startDate: start, endDate: end, reason: reason.trim() || null });
			onSubmitted();
		} catch (err) {
			setError(err.message || "신청에 실패했습니다.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
				<div className="form-field">
					<label>시작일</label>
					<input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
				</div>
				<div className="form-field">
					<label>종료일</label>
					<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
				</div>
			</div>
			<div className="form-field">
				<label>사유 (선택)</label>
				<textarea value={reason} onChange={(e) => setReason(e.target.value)} />
			</div>
			{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button className="btn btn-ghost" onClick={onCancel}>뒤로</button>
				<button className="btn btn-primary" disabled={submitting || !start || !end} onClick={submit}>{submitting ? "신청 중" : "신청"}</button>
			</div>
		</div>
	);
}
