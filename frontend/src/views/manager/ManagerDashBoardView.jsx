import { useState, useEffect, useCallback } from "react";
import { listAllScheduleRequests, listMembers } from "../../api/common.js";

export default function ManagerDashBoardView({ onNavigate, platformId, platformName }) {
	const [members, setMembers] = useState([]);
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setMembers([]);
			setRequests([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [memberList, requestList] = await Promise.all([
			listMembers(platformId).catch(() => []),
			listAllScheduleRequests([{ id: platformId }]).catch(() => [])
		]);
		setMembers(memberList);
		setRequests(requestList);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const pending = requests.filter((r) => r.status === "PENDING");

	return (
		<div className="page active" id="super-dashboard">
			<div className="page-header">
				<div className="page-title">{platformName || "대시보드"}</div>
				<div className="page-subtitle">회원 수와 처리할 승인 요청</div>
			</div>

			<div className="dash-kpi">
				<div className="kpi-card">
					<div className="kpi-val">{loading ? "-" : members.length}</div>
					<div className="kpi-key">전체 회원</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val">-</div>
					<div className="kpi-key">이번달 매출</div>
					<div className="kpi-sub" style={{ color: "var(--text-dim)" }}>집계 준비 중</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val">-</div>
					<div className="kpi-key">출결률</div>
					<div className="kpi-sub" style={{ color: "var(--text-dim)" }}>집계 준비 중</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-val" style={pending.length > 0 ? { color: "var(--accent-active-text)" } : undefined}>{loading ? "-" : pending.length}</div>
					<div className="kpi-key">승인 대기</div>
					</div>
			</div>

			<div className="dash-grid">
				<div className="card">
					<div className="card-title">처리 대기 업무</div>
					{loading ? (
						<div style={{ padding: "16px 0", color: "var(--text-dim)", fontSize: "13px" }}>불러오는 중</div>
					) : pending.length === 0 ? (
						<div style={{ padding: "16px 0", color: "var(--text-dim)", fontSize: "13px" }}>처리 대기 중인 요청이 없습니다</div>
					) : (
						pending.slice(0, 5).map((r) => (
							<div key={r.id} className="pending-item">
								<div className="pending-dot" style={{ background: "var(--accent3)" }}></div>
								<div className="pending-body">
									<div className="pending-title">{r.reason || "일정 변경 요청"}</div>
									<div className="pending-meta">기존 {r.originalDate} → 희망 {r.requestedDate}</div>
								</div>
								<button className="btn btn-ghost btn-sm" onClick={() => onNavigate("approval")}>
									처리
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
