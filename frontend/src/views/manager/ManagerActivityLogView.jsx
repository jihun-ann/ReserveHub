import { useState, useEffect, useCallback } from "react";
import { listActionLogs, ACTION_TARGET_LABEL, ACTION_LABEL } from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";

export default function ManagerActivityLogView({ platformId }) {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [targetFilter, setTargetFilter] = useState("ALL");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setLogs([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setLogs(await listActionLogs(platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const targets = [...new Set(logs.map((l) => l.targetType))];
	const filtered = targetFilter === "ALL" ? logs : logs.filter((l) => l.targetType === targetFilter);

	const selectStyle = {
		padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)",
		borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none"
	};

	return (
		<div className="page" id="manager-activity-log">
			<div className="page-header">
				<div className="page-label">ACTIVITY LOG</div>
				<div className="page-title">활동 이력</div>
				<div className="page-subtitle">이 플랫폼에서 처리된 승인·변경·등록 작업을 시각과 함께 확인하세요</div>
			</div>

			<div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
				<select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} style={selectStyle}>
					<option value="ALL">전체 항목</option>
					{targets.map((t) => (
						<option key={t} value={t}>{ACTION_TARGET_LABEL[t] || t}</option>
					))}
				</select>
			</div>

			<div className="card" style={{ padding: 0, overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>일시</th><th>처리자</th><th>항목</th><th>작업</th><th>메모</th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : filtered.length === 0 ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>이력이 없습니다</td></tr>
							) : (
								filtered.map((l) => (
									<tr key={l.id}>
										<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{formatDateTime(l.createdAt)}</td>
										<td>{l.actorName || "-"}</td>
										<td>{ACTION_TARGET_LABEL[l.targetType] || l.targetType}</td>
										<td>{ACTION_LABEL[l.action] || l.action}</td>
										<td style={{ color: "var(--text-sub)", minWidth: "260px", whiteSpace: "pre-wrap" }}>{l.memo || "-"}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
