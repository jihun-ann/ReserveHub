import { useState, useEffect, useCallback, Fragment } from "react";
import {
	listWorkRequests, listWorkRequestAssignees, createWorkRequest, workRequestStatusLabel, WORK_REQUEST_OPEN,
	listAllScheduleRequests, listMyScheduleRequests, approveScheduleRequest, rejectScheduleRequest,
	listAllLeaveRequests, listMyLeaveRequests, approveLeaveRequest, rejectLeaveRequest,
	listMySlots, getMyPermissions, getUser, leavePeriodLabel
} from "../api/common.js";
import { getCurrentUser } from "../api/http.js";
import { openModal, closeModal } from "./default.js";
import WorkRequestDetail from "../components/WorkRequestDetail.jsx";
import ScheduleChangeForm from "../components/ScheduleChangeForm.jsx";
import LeaveForm from "../components/LeaveForm.jsx";
import { formatDateTime } from "../utils/formatDateTime.js";

// 결재 — 결재함(내가 처리할 것)과 내 신청, 오너·매니저·세무사는 전체 조회까지 본다.
// 업무 요청(요청됨 → 확인함 → 진행 중 → 완료, 추가 확인 요청), 휴가·일정 변경(오너/매니저가 승인 → 반려)을
// 한 표에 모은다. 강사는 자기에게 온 업무 요청을 결재함에서 받는다.
const OFFICE_ROLES = ["OWNER", "MANAGER", "TAX_ACCOUNTANT"];
const APPROVER_ROLES = ["OWNER", "MANAGER"];
const KIND_LABEL = { WORK: "업무 요청", LEAVE: "휴가", SCHEDULE: "일정 변경" };
const APPROVAL_STATUS_LABEL = { PENDING: "대기 중", APPROVED: "승인됨", REJECTED: "반려됨" };
const OPEN_STATUSES = ["PENDING", ...WORK_REQUEST_OPEN];
const MODAL_ID = "approvalSubmitModal";
const EMPTY_QUERY = { text: "", kind: "", from: "", to: "" };

function statusColor(status) {
	if (status === "APPROVED" || status === "DONE") return "var(--green)";
	if (status === "REJECTED" || status === "REVISION_REQUESTED") return "var(--red)";
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

export default function ApprovalView({ platformId, platforms = [], role }) {
	const myId = getCurrentUser()?.id;
	const isOffice = OFFICE_ROLES.includes(role);
	const isApprover = APPROVER_ROLES.includes(role);

	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState("inbox"); // inbox | mine | all
	const [composeKey, setComposeKey] = useState(0);
	// draft는 입력 중인 조건, query는 검색 버튼(또는 Enter)으로 적용된 조건.
	const [draft, setDraft] = useState(EMPTY_QUERY);
	const [query, setQuery] = useState(EMPTY_QUERY);
	const [statusFilter, setStatusFilter] = useState("open"); // open | closed | all
	const [expandedId, setExpandedId] = useState(null);
	const [names, setNames] = useState({});
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
			listWorkRequests(platformId).catch(() => []), // 강사는 서버가 자기에게 온 것만 준다
			isApprover ? listAllScheduleRequests([{ id: platformId }]).catch(() => []) : [],
			listMyScheduleRequests().then((l) => l.filter(here)).catch(() => []),
			isApprover ? listAllLeaveRequests([{ id: platformId }]).catch(() => []) : [],
			listMyLeaveRequests().then((l) => l.filter(here)).catch(() => [])
		]);
		const unique = (list) => [...new Map(list.map((r) => [r.id, r])).values()];
		return [
			// 내 할 일(요청자 = 담당자)은 결재가 아니라 대시보드 할 일에서만 다룬다.
			...work.filter((r) => r.requestedBy !== r.assigneeId).map((r) => ({ ...r, kind: "WORK" })),
			...unique([...allSchedules, ...mySchedules]).map((r) => ({ ...r, kind: "SCHEDULE" })),
			...unique([...allLeaves, ...myLeaves]).map((r) => ({ ...r, kind: "LEAVE" }))
		].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
	}, [platformId, isApprover]);

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
				setNames((prev) => ({ ...prev, ...Object.fromEntries(list.map((a) => [a.userId, a.name])) }));
			}).catch(() => {});
		}
	}, [platformId, isOffice, isApprover]);

	// 휴가·일정 변경 신청자, 강사 화면의 업무 요청자처럼 담당자 목록에 없는 사람은 따로 이름을 찾는다.
	useEffect(() => {
		const missing = [...new Set(items.flatMap((r) => [r.requestedBy, r.decidedBy, r.assigneeId]).filter(Boolean))].filter((id) => !(id in names));
		if (missing.length === 0) return;
		Promise.all(missing.map((id) => getUser(id).then((u) => [id, u.name]).catch(() => [id, null]))).then((pairs) => {
			setNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
		});
	}, [items, names]);

	const nameOf = (id) => (id === myId ? "나" : names[id] || "-");

	// 결재함: 내가 담당인 업무 요청 + (오너/매니저면) 다른 사람이 올린 휴가·일정 변경. 내 신청: 내가 올린 것 전부.
	const inInbox = (r) => (r.kind === "WORK" ? r.assigneeId === myId : isApprover && r.requestedBy !== myId);
	const summaryOf = (r) => (r.kind === "WORK" ? r.title : r.kind === "LEAVE" ? leavePeriodLabel(r) : `${r.originalDate} → ${r.requestedDate}`);
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
		setComposeKey((k) => k + 1); // 신청 창을 열 때마다 이전 입력을 비운다
		openModal(MODAL_ID);
	}

	function submitted(sentPlatformId = platformId) {
		closeModal(MODAL_ID);
		setCategory(null);
		setTab("mine");
		setStatusFilter("open");
		refresh();
		// 목록은 지금 보고 있는 플랫폼 것만 보여 주므로, 다른 플랫폼으로 보냈으면 알려 준다.
		if (sentPlatformId !== platformId) {
			const name = platforms.find((p) => p.id === sentPlatformId)?.name || "다른 플랫폼";
			alert(`${name}에 업무 요청을 보냈습니다. 해당 플랫폼으로 바꾸면 내 신청에서 볼 수 있습니다.`);
		}
	}

	function renderDetail(r) {
		if (r.kind === "WORK") return <WorkRequestDetail request={r} nameOf={nameOf} onChanged={refresh} />;

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
					{isLeave ? <span>{leavePeriodLabel(r)}</span> : <span>{r.originalDate} → {r.requestedDate}</span>}
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
						<div className="page-subtitle">업무 요청, 휴가, 일정 변경</div>
					</div>
					{categories.length > 0 && <button className="btn btn-primary" onClick={openSubmit}>결재 신청</button>}
				</div>

				<div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
					<div className="seg">
						<button className={tab === "inbox" ? "active" : ""} onClick={() => setTab("inbox")}>
							결재함{inboxOpenCount > 0 && <span className="seg-count">{inboxOpenCount}</span>}
						</button>
						<button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>내 신청</button>
						{isOffice && <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>전체 조회</button>}
					</div>
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
						{Object.entries(KIND_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
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
										const label = r.kind === "WORK" ? workRequestStatusLabel(r) : APPROVAL_STATUS_LABEL[r.status];
										const summary = summaryOf(r);
										// 내가 받은 업무 요청을 아직 안 열어 봤으면 굵게 + 점.
										const unread = r.kind === "WORK" && r.assigneeId === myId && !r.readAt && WORK_REQUEST_OPEN.includes(r.status);
										return (
											<Fragment key={key}>
												<tr onClick={() => setExpandedId(open ? null : key)} style={{ cursor: "pointer", background: open ? "var(--surface2)" : undefined }}>
													<td style={{ color: "var(--text-sub)" }}>{KIND_LABEL[r.kind]}</td>
													<td style={{ fontWeight: unread ? 700 : 500 }}>
														<span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
															{unread && <span aria-label="안 읽음" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
															{r.urgent && WORK_REQUEST_OPEN.includes(r.status) && (
																<span style={{ fontSize: "11px", fontWeight: 600, color: "var(--red)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0 4px", flexShrink: 0 }}>긴급</span>
															)}
															{summary}
														</span>
													</td>
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
				<div className="modal-box" style={{ width: category === "LEAVE" ? "min(640px, 94vw)" : "min(520px, 92vw)" }}>
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
						<ComposeForm key={composeKey} platforms={platforms} defaultPlatformId={platformId} myId={myId} onSubmitted={submitted} onCancel={() => setCategory(null)} />
					)}
					{category === "LEAVE" && <LeaveForm platformId={platformId} onSubmitted={submitted} onCancel={() => setCategory(null)} />}
					{category === "SCHEDULE" && <ScheduleChangeForm slots={mySlots} onSubmitted={submitted} onCancel={() => setCategory(null)} />}
				</div>
			</div>
		</>
	);
}

// 업무 요청 쓰기 — 플랫폼을 먼저 고르면 그 플랫폼 사람들 중에서 대상(매니저/강사)과 담당자를 고른다.
// 오너·매니저·세무사로 있는 플랫폼에만 보낼 수 있다.
function ComposeForm({ platforms, defaultPlatformId, myId, onSubmitted, onCancel }) {
	const sendable = platforms.filter((p) => p.roles.some((r) => OFFICE_ROLES.includes(r)));
	const [targetId, setTargetId] = useState(defaultPlatformId);
	const [people, setPeople] = useState(null);

	useEffect(() => {
		if (!targetId) return;
		let alive = true;
		listWorkRequestAssignees(targetId)
			.then((list) => alive && setPeople(list))
			.catch(() => alive && setPeople([]));
		return () => { alive = false; };
	}, [targetId]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div className="form-field">
				<label>플랫폼</label>
				<select value={targetId || ""} onChange={(e) => { setPeople(null); setTargetId(e.target.value); }}>
					{sendable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
				</select>
			</div>
			{people === null ? (
				<div style={{ fontSize: "13px", color: "var(--text-dim)" }}>담당자 불러오는 중</div>
			) : (
				<WorkRequestForm
					key={targetId}
					platformId={targetId}
					assignees={people}
					myId={myId}
					onSubmitted={() => onSubmitted(targetId)}
					onCancel={onCancel}
				/>
			)}
		</div>
	);
}

function WorkRequestForm({ platformId, assignees, myId, onSubmitted, onCancel }) {
	const [form, setForm] = useState({ title: "", assigneeId: "", dueDate: "", memo: "", urgent: false });
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	// 대상은 매니저/강사 중에서 먼저 고르고, 그 안에서 담당자를 고른다. 나 자신은 빠진다(개인 할 일은 대시보드에서).
	const others = assignees.filter((a) => a.userId !== myId);
	const [targetRole, setTargetRole] = useState(() => (others.some((a) => a.role === "MANAGER") || !others.some((a) => a.role === "TUTOR") ? "MANAGER" : "TUTOR"));
	const candidates = others.filter((a) => a.role === targetRole);
	const assigneeId = candidates.some((a) => a.userId === form.assigneeId) ? form.assigneeId : candidates[0]?.userId;

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
			<div className="form-field">
				<label>대상</label>
				<div className="seg">
					{[["MANAGER", "매니저"], ["TUTOR", "강사"]].map(([k, label]) => (
						<button key={k} type="button" className={targetRole === k ? "active" : ""} onClick={() => setTargetRole(k)}>{label}</button>
					))}
				</div>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
				<div className="form-field">
					<label>담당자</label>
					{candidates.length === 0 ? (
						<div style={{ fontSize: "13px", color: "var(--text-dim)", padding: "8px 0" }}>{targetRole === "MANAGER" ? "매니저" : "강사"}가 없습니다</div>
					) : (
						<select value={assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
							{candidates.map((a) => <option key={a.userId} value={a.userId}>{a.name}</option>)}
						</select>
					)}
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
			{assigneeId !== myId && (
				<label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
					<input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} style={{ accentColor: "var(--accent)" }} />
					긴급 — 담당자 할 일 맨 위에 올립니다
				</label>
			)}
			{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button type="button" className="btn btn-ghost" onClick={onCancel}>뒤로</button>
				<button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim() || !assigneeId}>{submitting ? "신청 중" : "신청"}</button>
			</div>
		</form>
	);
}
