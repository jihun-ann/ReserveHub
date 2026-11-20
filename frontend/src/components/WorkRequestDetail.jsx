import { useEffect } from "react";
import {
	changeWorkRequestStatus, markWorkRequestRead, markWorkRequestUrgent, WORK_REQUEST_OPEN
} from "../api/common.js";
import { getCurrentUser } from "../api/http.js";
import { formatDateTime } from "../utils/formatDateTime.js";
import WorkRequestThread from "./WorkRequestThread.jsx";

// 업무 요청 한 건 펼친 내용 — 요청/담당/기한, 본문, 상태 버튼, 댓글 스레드.
// 담당자가 처음 열면 "확인함"으로 남긴다(onChanged로 목록을 새로 고침).
export default function WorkRequestDetail({ request: r, nameOf, onChanged }) {
	const myId = getCurrentUser()?.id;
	const isAssignee = r.assigneeId === myId;
	const isRequester = r.requestedBy === myId;
	const open = WORK_REQUEST_OPEN.includes(r.status);

	useEffect(() => {
		if (isAssignee && !isRequester && !r.readAt) markWorkRequestRead(r.id).then(onChanged).catch(() => {});
	}, [r.id, r.readAt, isAssignee, isRequester, onChanged]);

	async function run(action) {
		try {
			await action();
			await onChanged();
		} catch (err) {
			alert(err.message || "처리하지 못했습니다.");
		}
	}

	const status = (next) => run(() => changeWorkRequestStatus(r.id, next));

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "var(--text-sub)", flexWrap: "wrap" }}>
				<span>요청 {nameOf(r.requestedBy)}</span>
				<span>담당 {nameOf(r.assigneeId)}</span>
				{r.dueDate && <span style={{ fontFamily: "var(--mono)" }}>기한 {r.dueDate}</span>}
				{r.readAt && !isRequester && <span>확인 {formatDateTime(r.readAt)}</span>}
				{r.readAt && isRequester && r.assigneeId !== myId && <span>담당자 확인 {formatDateTime(r.readAt)}</span>}
				{!r.readAt && isRequester && r.assigneeId !== myId && open && <span>담당자 미확인</span>}
			</div>
			{r.memo && <div style={{ fontSize: "13px", whiteSpace: "pre-wrap" }}>{r.memo}</div>}
			<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
				{open && isAssignee && r.status !== "IN_PROGRESS" && (
					<button className="btn btn-ghost btn-sm" onClick={() => status("IN_PROGRESS")}>진행 중으로</button>
				)}
				{open && isAssignee && <button className="btn btn-primary btn-sm" onClick={() => status("DONE")}>완료</button>}
				{open && isRequester && !isAssignee && !r.urgent && (
					<button className="btn btn-ghost btn-sm" onClick={() => run(() => markWorkRequestUrgent(r.id))}>긴급 요청</button>
				)}
				{r.status === "DONE" && isRequester && !isAssignee && (
					<button
						className="btn btn-ghost btn-sm"
						onClick={() => window.confirm("담당자에게 추가 확인을 요청할까요? 필요한 내용은 아래 댓글로 남겨 주세요.") && status("REVISION_REQUESTED")}
					>
						추가 확인 요청
					</button>
				)}
				{open && isRequester && (
					<button className="btn btn-danger btn-sm" onClick={() => window.confirm("이 업무 요청을 취소할까요?") && status("CANCELED")}>요청 취소</button>
				)}
			</div>
			<WorkRequestThread requestId={r.id} />
		</div>
	);
}
