import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronUp, ChevronDown, X } from "lucide-react";
import {
	listWorkRequests, createWorkRequest, changeWorkRequestStatus, listAllScheduleRequests, listAllLeaveRequests,
	reorderWorkRequests, deleteWorkRequestTodo, byWorkPriority, getUser, leavePeriodLabel, WORK_REQUEST_OPEN, WORK_REQUEST_STATUS_LABEL
} from "../api/common.js";
import { getCurrentUser } from "../api/http.js";

// 대시보드의 "처리 대기 업무" — 받은 업무(남이 맡긴 일)와 내 할 일(나만 보는 할 일)을 한 목록에 섞어 보여준다.
// 받은 업무에는 표시를 달고, 내 할 일만 지울 수 있다. 순서는 오른쪽 화살표로 내가 정하되,
// 요청자가 긴급으로 보낸 업무는 항상 맨 위(긴급끼리는 먼저 온 순)에 고정된다.
// 아래에는 내가 승인할 휴가·일정 변경을 붙인다.
export default function MyTasksCard({ platformId, canApprove, onOpenApproval }) {
	const myId = getCurrentUser()?.id;
	const [tasks, setTasks] = useState([]);
	const [approvals, setApprovals] = useState([]);
	const [loaded, setLoaded] = useState(false);
	const [title, setTitle] = useState("");
	const [adding, setAdding] = useState(false);

	const load = useCallback(async () => {
		if (!platformId) return [[], []];
		const [work, schedules, leaves] = await Promise.all([
			listWorkRequests(platformId).catch(() => []),
			canApprove ? listAllScheduleRequests([{ id: platformId }]).catch(() => []) : [],
			canApprove ? listAllLeaveRequests([{ id: platformId }]).catch(() => []) : []
		]);
		const mine = work.filter((r) => r.assigneeId === myId && WORK_REQUEST_OPEN.includes(r.status));
		const pending = [
			...schedules.map((r) => ({ ...r, label: `일정 변경 · ${r.originalDate} → ${r.requestedDate}` })),
			...leaves.map((r) => ({ ...r, label: `휴가 · ${leavePeriodLabel(r)}` }))
		].filter((r) => r.status === "PENDING" && r.requestedBy !== myId);
		return [mine, pending];
	}, [platformId, canApprove, myId]);

	const apply = ([mine, pending]) => {
		setTasks(mine);
		setApprovals(pending);
	};

	useEffect(() => {
		load().then(apply).finally(() => setLoaded(true));
	}, [load]);

	// 받은 업무를 보낸 사람 이름 — 처음 보는 사람만 조회한다.
	const [names, setNames] = useState({});
	useEffect(() => {
		const missing = [...new Set(tasks.filter((t) => t.requestedBy !== myId).map((t) => t.requestedBy))].filter((id) => !(id in names));
		if (missing.length === 0) return;
		Promise.all(missing.map((id) => getUser(id).then((u) => [id, u.name]).catch(() => [id, null]))).then((pairs) => {
			setNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
		});
	}, [tasks, names, myId]);

	const sorted = [...tasks].sort(byWorkPriority);
	const movable = sorted.filter((t) => !t.urgent);

	async function run(action, failMessage) {
		try {
			await action();
			apply(await load());
		} catch (err) {
			alert(err.message || failMessage);
		}
	}

	async function add(e) {
		e.preventDefault();
		if (!title.trim()) return;
		setAdding(true);
		await run(async () => {
			await createWorkRequest(platformId, { assigneeId: myId, title: title.trim() });
			setTitle("");
		}, "추가하지 못했습니다.");
		setAdding(false);
	}

	const complete = (t) => run(() => changeWorkRequestStatus(t.id, "DONE"), "완료 처리하지 못했습니다.");

	const remove = (t) =>
		window.confirm(`'${t.title}' 할 일을 삭제할까요?`) && run(() => deleteWorkRequestTodo(t.id), "삭제하지 못했습니다.");

	// 긴급이 아닌 것들 사이에서 한 칸 옮기고, 그 순서를 통째로 저장한다.
	async function move(id, delta) {
		const next = [...movable];
		const i = next.findIndex((t) => t.id === id);
		const j = i + delta;
		if (i < 0 || j < 0 || j >= next.length) return;
		[next[i], next[j]] = [next[j], next[i]];
		const order = new Map(next.map((t, k) => [t.id, k]));
		setTasks((prev) => prev.map((t) => (order.has(t.id) ? { ...t, sortOrder: order.get(t.id) } : t)));
		try {
			await reorderWorkRequests(platformId, next.map((t) => t.id));
		} catch (err) {
			alert(err.message || "순서를 저장하지 못했습니다.");
			apply(await load());
		}
	}

	const empty = loaded && tasks.length === 0 && approvals.length === 0;
	const iconBtn = { width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--text-dim)", cursor: "pointer", padding: 0 };
	const tag = (color) => ({ fontSize: "11px", fontWeight: 600, color, border: `1px solid ${color}`, borderRadius: "4px", padding: "0 4px", flexShrink: 0 });

	return (
		<div className="card">
			<div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<span>처리 대기 업무</span>
				<button className="btn btn-ghost btn-sm" onClick={onOpenApproval}>결재로 이동</button>
			</div>

			<form onSubmit={add} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="내 할 일 추가 (나만 보임)"
					maxLength={200}
					style={{ flex: 1, height: "36px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", font: "inherit", fontSize: "13px" }}
				/>
				<button className="btn btn-ghost btn-sm" type="submit" disabled={adding || !title.trim()} aria-label="할 일 추가" style={{ display: "inline-flex", alignItems: "center" }}>
					<Plus size={16} strokeWidth={1.5} />
				</button>
			</form>

			{empty && <div style={{ padding: "16px 0", color: "var(--text-dim)", fontSize: "13px", textAlign: "center" }}>처리할 업무가 없습니다</div>}

			{sorted.map((t) => {
				const received = t.requestedBy !== myId;
				const idx = movable.findIndex((x) => x.id === t.id);
				return (
					<div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
						<input type="checkbox" checked={false} aria-label={`${t.title} 완료`} onChange={() => complete(t)} style={{ width: "16px", height: "16px", accentColor: "var(--accent)", cursor: "pointer" }} />
						<span style={{ flex: 1, display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
							{t.urgent && <span style={tag("var(--red)")}>긴급</span>}
							{received && <span style={tag("var(--accent)")}>{names[t.requestedBy] ? `${names[t.requestedBy]} 요청` : "받은 업무"}</span>}
							<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
							{t.status === "REVISION_REQUESTED" && <span style={{ color: "var(--red)", fontSize: "12px", flexShrink: 0 }}>{WORK_REQUEST_STATUS_LABEL[t.status]}</span>}
						</span>
						{t.dueDate && <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>{t.dueDate.slice(5)}</span>}
						{t.urgent ? (
							<span style={{ width: "48px" }} />
						) : (
							<span style={{ display: "inline-flex" }}>
								<button type="button" aria-label="위로" disabled={idx <= 0} onClick={() => move(t.id, -1)} style={{ ...iconBtn, opacity: idx <= 0 ? 0.3 : 1 }}>
									<ChevronUp size={16} strokeWidth={1.5} />
								</button>
								<button type="button" aria-label="아래로" disabled={idx >= movable.length - 1} onClick={() => move(t.id, 1)} style={{ ...iconBtn, opacity: idx >= movable.length - 1 ? 0.3 : 1 }}>
									<ChevronDown size={16} strokeWidth={1.5} />
								</button>
							</span>
						)}
						{received ? (
							<span style={{ width: "24px" }} />
						) : (
							<button type="button" aria-label={`${t.title} 삭제`} onClick={() => remove(t)} style={iconBtn}>
								<X size={16} strokeWidth={1.5} />
							</button>
						)}
					</div>
				);
			})}

			{approvals.length > 0 && <div style={{ fontSize: "12px", color: "var(--text-dim)", margin: "12px 0 4px" }}>승인 대기</div>}
			{approvals.map((r) => (
				<button
					key={`${r.label}-${r.id}`}
					onClick={onOpenApproval}
					style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", minHeight: "36px", border: "none", borderBottom: "1px solid var(--border)", background: "none", color: "var(--text)", font: "inherit", fontSize: "13px", textAlign: "left", cursor: "pointer", padding: 0 }}
				>
					<span style={{ width: "16px", display: "inline-flex", justifyContent: "center" }}>
						<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent3)" }} />
					</span>
					<span style={{ flex: 1 }}>{r.label}</span>
					<span style={{ fontSize: "12px", color: "var(--text-dim)" }}>승인 대기</span>
				</button>
			))}
		</div>
	);
}
