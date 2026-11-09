import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import {
	listWorkRequests, createWorkRequest, changeWorkRequestStatus, listAllScheduleRequests, listAllLeaveRequests
} from "../api/common.js";
import { getCurrentUser } from "../api/http.js";

// 대시보드의 "처리 대기 업무" — 내가 담당인 업무 요청과 내가 승인할 휴가·일정 변경을 모아 보여준다.
// 맨 위 입력칸으로 나에게 맡기는 할 일(요청자 = 담당자인 업무 요청)을 바로 추가하고, 체크하면 완료된다.
// 휴가·일정 변경과 자세한 처리는 결재 화면에서 한다.
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
		const mine = work
			.filter((r) => r.assigneeId === myId && (r.status === "REQUESTED" || r.status === "IN_PROGRESS"))
			.sort((a, b) => (a.dueDate || "9999") < (b.dueDate || "9999") ? -1 : 1);
		const pending = [
			...schedules.map((r) => ({ ...r, label: `일정 변경 · ${r.originalDate} → ${r.requestedDate}` })),
			...leaves.map((r) => ({ ...r, label: `휴가 · ${r.startDate} ~ ${r.endDate}` }))
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

	async function add(e) {
		e.preventDefault();
		if (!title.trim()) return;
		setAdding(true);
		try {
			await createWorkRequest(platformId, { assigneeId: myId, title: title.trim() });
			setTitle("");
			apply(await load());
		} catch (err) {
			alert(err.message || "추가하지 못했습니다.");
		} finally {
			setAdding(false);
		}
	}

	async function complete(id) {
		try {
			await changeWorkRequestStatus(id, "DONE");
			apply(await load());
		} catch (err) {
			alert(err.message || "완료 처리하지 못했습니다.");
		}
	}

	const empty = loaded && tasks.length === 0 && approvals.length === 0;

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
					placeholder="할 일 추가"
					maxLength={200}
					style={{ flex: 1, height: "36px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", font: "inherit", fontSize: "13px" }}
				/>
				<button className="btn btn-ghost btn-sm" type="submit" disabled={adding || !title.trim()} aria-label="할 일 추가" style={{ display: "inline-flex", alignItems: "center" }}>
					<Plus size={16} strokeWidth={1.5} />
				</button>
			</form>

			{empty && <div style={{ padding: "16px 0", color: "var(--text-dim)", fontSize: "13px", textAlign: "center" }}>처리할 업무가 없습니다</div>}

			<div style={{ display: "flex", flexDirection: "column" }}>
				{tasks.map((t) => (
					<label key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", borderBottom: "1px solid var(--border)", cursor: "pointer", fontSize: "13px" }}>
						<input type="checkbox" onChange={() => complete(t.id)} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
						<span style={{ flex: 1 }}>
							{t.title}
							{t.requestedBy !== myId && <span style={{ color: "var(--text-dim)" }}> · 요청받음</span>}
						</span>
						{t.dueDate && <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>{t.dueDate.slice(5)}</span>}
					</label>
				))}
				{approvals.map((r) => (
					<button
						key={`${r.label}-${r.id}`}
						onClick={onOpenApproval}
						style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", border: "none", borderBottom: "1px solid var(--border)", background: "none", color: "var(--text)", font: "inherit", fontSize: "13px", textAlign: "left", cursor: "pointer", padding: 0 }}
					>
						<span style={{ width: "16px", display: "inline-flex", justifyContent: "center" }}>
							<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent3)" }} />
						</span>
						<span style={{ flex: 1 }}>{r.label}</span>
						<span style={{ fontSize: "12px", color: "var(--text-dim)" }}>승인 대기</span>
					</button>
				))}
			</div>
		</div>
	);
}
