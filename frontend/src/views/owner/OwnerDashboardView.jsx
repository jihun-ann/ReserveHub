import { useState } from "react";
import {
	approveScheduleRequest, rejectScheduleRequest, approveLeaveRequest, rejectLeaveRequest, hexAlpha, businessTypeLabel
} from "../../api/common.js";

export default function OwnerDashboardView({ platforms, requests, onDecided, onNavigate }) {
	const [busyId, setBusyId] = useState(null);
	const pending = requests.filter((r) => r.status === "PENDING");

	async function decide(request, action) {
		setBusyId(request.id);
		try {
			if (request.requestType === "LEAVE") {
				await (action === "approve" ? approveLeaveRequest(request.id) : rejectLeaveRequest(request.id));
			} else {
				await (action === "approve" ? approveScheduleRequest(request.id) : rejectScheduleRequest(request.id));
			}
			onDecided();
		} catch (err) {
			alert(err.message || "처리 중 오류가 발생했습니다.");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div id="owner-dashboard" className="page active">
			<div className="page-header">
				<div className="page-label">Owner Admin / Dashboard</div>
				<div className="page-title">대시보드</div>
				<div className="page-subtitle">전체 플랫폼 현황을 한눈에 확인하세요</div>
			</div>

			{/* KPI 2칸 (매출/회원 집계는 아직 백엔드 미지원) */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px", marginBottom: "24px" }}>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>활성 플랫폼</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "32px", fontWeight: 500, color: "var(--owner)", lineHeight: 1 }}>{platforms.length}</div>
				</div>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>대기 승인</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "32px", fontWeight: 500, color: "var(--owner)", lineHeight: 1 }}>{pending.length}</div>
					<div style={{ fontSize: "11px", color: "var(--owner)", marginTop: "6px" }}>처리 필요</div>
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
											<div style={{ fontWeight: 700, fontSize: "13px" }}>{p.name}</div>
										</div>
									</td>
									<td>{businessTypeLabel(p.businessType)}</td>
									<td><span className={`plat-status ${p.status === "ACTIVE" ? "ps-active" : "ps-expired"}`} style={{ fontSize: "10px" }}>{p.status === "ACTIVE" ? "운영 중" : p.status}</span></td>
								</tr>
							))}
							{platforms.length === 0 && (
								<tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-dim)", padding: "20px" }}>등록된 플랫폼이 없습니다</td></tr>
							)}
							</tbody>
						</table>
					</div>
				</div>

				{/* 승인 대기 빠른 처리 */}
				<div className="card">
					<div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<span>승인 대기</span>
						<span style={{ background: "rgba(var(--owner-rgb),0.15)", color: "var(--owner)", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{pending.length}건</span>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
						{pending.length === 0 && (
							<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>처리할 승인 요청이 없습니다</div>
						)}
						{pending.map((r) => (
							<div key={r.id} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "14px" }}>
								<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
									<div>
										{r.requestType === "LEAVE" ? (
											<>
												<div style={{ fontSize: "13px", fontWeight: 700 }}>{r.startDate} ~ {r.endDate} 휴가 요청</div>
												{r.reason && <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>{r.reason}</div>}
											</>
										) : (
											<>
												<div style={{ fontSize: "13px", fontWeight: 700 }}>{r.requestedDate} 일정 변경 요청</div>
												<div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>{r.originalDate} → {r.requestedDate}</div>
											</>
										)}
										<div style={{ marginTop: "4px" }}>
											<span className="plat-chip" style={{ background: hexAlpha(r.platform.colorHex, 0.12), color: r.platform.colorHex, borderColor: hexAlpha(r.platform.colorHex, 0.3) }}>
												{r.platform.emoji} {r.platform.name}
											</span>
										</div>
									</div>
								</div>
								<div style={{ display: "flex", gap: "6px" }}>
									<button
										className="btn btn-sm"
										disabled={busyId === r.id}
										style={{ flex: 1, background: "rgba(var(--green-rgb),0.12)", color: "var(--green)", border: "1px solid rgba(var(--green-rgb),0.3)" }}
										onClick={() => decide(r, "approve")}
									>
										승인
									</button>
									<button className="btn btn-sm btn-danger" style={{ flex: 1 }} disabled={busyId === r.id} onClick={() => decide(r, "reject")}>반려</button>
								</div>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	);
}
