import { useState, useEffect, useCallback } from "react";
import { listAllScheduleRequests, listMembers } from "../../api/common.js";
import MyTasksCard from "../../components/MyTasksCard.jsx";

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
				<MyTasksCard platformId={platformId} canApprove onOpenApproval={() => onNavigate("approval")} />
			</div>
		</div>
	);
}
