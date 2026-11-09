import { businessTypeLabel } from "../../api/common.js";
import MyTasksCard from "../../components/MyTasksCard.jsx";

// 처리 대기 업무(할 일·승인 대기)는 현재 고른 플랫폼 기준 — 실제 승인/반려는 결재 화면에서 한다.
export default function OwnerDashboardView({ platforms, requests, platformId, onNavigate }) {
	const pending = requests.filter((r) => r.status === "PENDING");

	return (
		<div id="owner-dashboard" className="page active">
			<div className="page-header">
				<div className="page-title">대시보드</div>
				<div className="page-subtitle">운영 중인 플랫폼과 처리할 승인 요청</div>
			</div>

			{/* KPI 2칸 (매출/회원 집계는 아직 백엔드 미지원) */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,240px))", gap: "16px", marginBottom: "24px" }}>
				<div className="card" style={{ padding: "20px" }}>
					<div style={{ fontSize: "13px", color: "var(--text-sub)", marginBottom: "8px" }}>활성 플랫폼</div>
					<div className="stat-figure">{platforms.length}</div>
				</div>
				<div className="card" style={{ padding: "20px" }}>
					<div style={{ fontSize: "13px", color: "var(--text-sub)", marginBottom: "8px" }}>승인 대기</div>
					<div className="stat-figure" style={pending.length > 0 ? { color: "var(--accent-active-text)" } : undefined}>{pending.length}</div>
				</div>
			</div>

			<div className="grid-main-side" style={{ gap: "20px", "--side-w": "340px" }}>

				{/* 플랫폼 목록 */}
				<div className="card">
					<div className="card-title">플랫폼별 현황</div>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
							<tr>
								<th>플랫폼</th>
								<th>업종</th>
								<th>상태</th>
							</tr>
							</thead>
							<tbody>
							{platforms.map((p) => (
								<tr key={p.id} style={{ cursor: "pointer" }} onClick={() => onNavigate("platform")}>
									<td>
										<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
											<span style={{ display: "inline-block", width: "10px", height: "10px", background: p.colorHex, borderRadius: "2px", flexShrink: 0 }}></span>
											<div style={{ fontWeight: 600, fontSize: "13px" }}>{p.name}</div>
										</div>
									</td>
									<td>{businessTypeLabel(p.businessType)}</td>
									<td><span className={`plat-status ${p.status === "ACTIVE" ? "ps-active" : "ps-expired"}`} style={{ fontSize: "11px" }}>{p.status === "ACTIVE" ? "운영 중" : p.status}</span></td>
								</tr>
							))}
							{platforms.length === 0 && (
								<tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-dim)", padding: "20px" }}>등록된 플랫폼이 없습니다</td></tr>
							)}
							</tbody>
						</table>
					</div>
				</div>

				<MyTasksCard platformId={platformId} canApprove onOpenApproval={() => onNavigate("approval")} />

			</div>
		</div>
	);
}
