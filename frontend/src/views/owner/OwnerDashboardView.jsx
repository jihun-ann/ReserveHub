import { useState } from "react";

export default function OwnerDashboardView({ onNavigate }) {
	const [pendingApprovals, setPendingApprovals] = useState([
		{
			id: "d1",
			title: "홍길동 — 1:1 레슨 변경",
			meta: "02.26 10:00 → 02.28 14:00",
			platformLabel: "🤸 필라테스",
			platformStyle: { background: "rgba(124,106,247,0.12)", color: "#7c6af7", borderColor: "rgba(124,106,247,0.3)" },
			requester: "이수진 트레이너"
		},
		{
			id: "d2",
			title: "최유나 — 그룹반 B 변경",
			meta: "02.26 14:00 → 03.01 14:00",
			platformLabel: "🧘 요가",
			platformStyle: { background: "rgba(79,209,197,0.12)", color: "#4fd1c5", borderColor: "rgba(79,209,197,0.3)" },
			requester: "이수진 트레이너"
		}
	]);

	function processApproval(id) {
		setPendingApprovals((prev) => prev.filter((p) => p.id !== id));
	}

	return (
		<div id="owner-dashboard" className="page active">
			<div className="page-header">
				<div className="page-label">Owner Admin / Dashboard</div>
				<div className="page-title">대시보드</div>
				<div className="page-subtitle">전체 플랫폼 현황을 한눈에 확인하세요</div>
			</div>

			{/* KPI 4칸 */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>활성 플랫폼</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "32px", fontWeight: 500, color: "#f6ad55", lineHeight: 1 }}>3</div>
					<div style={{ fontSize: "11px", color: "var(--green)", marginTop: "6px" }}>+1 이번 달</div>
				</div>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>전체 회원</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "32px", fontWeight: 500, color: "#7c6af7", lineHeight: 1 }}>284</div>
					<div style={{ fontSize: "11px", color: "var(--green)", marginTop: "6px" }}>+12 이번 달</div>
				</div>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>이번 달 매출</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "28px", fontWeight: 500, color: "#4fd1c5", lineHeight: 1 }}>18.4<span style={{ fontSize: "14px" }}>만</span></div>
					<div style={{ fontSize: "11px", color: "var(--green)", marginTop: "6px" }}>↑ 9% vs 지난달</div>
				</div>
				<div className="card" style={{ padding: "20px", textAlign: "center" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>대기 승인</div>
					<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "32px", fontWeight: 500, color: "#f87171", lineHeight: 1 }}>{pendingApprovals.length}</div>
					<div style={{ fontSize: "11px", color: "var(--red)", marginTop: "6px" }}>처리 필요</div>
				</div>
			</div>

			{/* 플랫폼별 현황 + 승인 대기 */}
			<div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

				{/* 플랫폼 현황 테이블 */}
				<div className="card">
					<div className="card-title">플랫폼별 현황</div>
					<div style={{ overflowX: "auto" }}>
						<table className="attend-table">
							<thead>
							<tr>
								<th>플랫폼</th>
								<th>회원</th>
								<th>강사</th>
								<th>이번 달 매출</th>
								<th>출결률</th>
								<th>상태</th>
							</tr>
							</thead>
							<tbody>
							<tr style={{ cursor: "pointer" }} onClick={() => onNavigate("platform")}>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
										<span style={{ display: "inline-block", width: "10px", height: "10px", background: "#7c6af7", borderRadius: "2px", flexShrink: 0 }}></span>
										<div><div style={{ fontWeight: 700, fontSize: "13px" }}>스튜디오 필라테스 강남</div><div style={{ fontSize: "11px", color: "var(--text-sub)" }}>필라테스</div></div>
									</div>
								</td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>142명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>4명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>9.8만</span></td>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<div style={{ width: "50px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}><div style={{ width: "93%", height: "100%", background: "#4fd1c5", borderRadius: "2px" }}></div></div>
										<span style={{ fontSize: "11px", color: "#4fd1c5" }}>93%</span>
									</div>
								</td>
								<td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영 중</span></td>
							</tr>
							<tr style={{ cursor: "pointer" }} onClick={() => onNavigate("platform")}>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
										<span style={{ display: "inline-block", width: "10px", height: "10px", background: "#4fd1c5", borderRadius: "2px", flexShrink: 0 }}></span>
										<div><div style={{ fontWeight: 700, fontSize: "13px" }}>요가라운지 홍대</div><div style={{ fontSize: "11px", color: "var(--text-sub)" }}>요가</div></div>
									</div>
								</td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>86명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>2명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>5.2만</span></td>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<div style={{ width: "50px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}><div style={{ width: "88%", height: "100%", background: "#4fd1c5", borderRadius: "2px" }}></div></div>
										<span style={{ fontSize: "11px", color: "#4fd1c5" }}>88%</span>
									</div>
								</td>
								<td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영 중</span></td>
							</tr>
							<tr style={{ cursor: "pointer" }} onClick={() => onNavigate("platform")}>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
										<span style={{ display: "inline-block", width: "10px", height: "10px", background: "#f6ad55", borderRadius: "2px", flexShrink: 0 }}></span>
										<div><div style={{ fontWeight: 700, fontSize: "13px" }}>뮤직하우스 홍대</div><div style={{ fontSize: "11px", color: "var(--text-sub)" }}>음악</div></div>
									</div>
								</td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>56명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace" }}>3명</span></td>
								<td><span style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>3.4만</span></td>
								<td>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<div style={{ width: "50px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}><div style={{ width: "79%", height: "100%", background: "#4fd1c5", borderRadius: "2px" }}></div></div>
										<span style={{ fontSize: "11px", color: "#4fd1c5" }}>79%</span>
									</div>
								</td>
								<td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영 중</span></td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* 승인 대기 빠른 처리 */}
				<div className="card">
					<div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<span>승인 대기</span>
						<span style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{pendingApprovals.length}건</span>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
						{pendingApprovals.length === 0 && (
							<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>처리할 승인 요청이 없습니다</div>
						)}
						{pendingApprovals.map((p) => (
							<div key={p.id} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "14px" }}>
								<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
									<div>
										<div style={{ fontSize: "13px", fontWeight: 700 }}>{p.title}</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>{p.meta}</div>
										<div style={{ marginTop: "4px" }}><span className="plat-chip" style={p.platformStyle}>{p.platformLabel}</span></div>
									</div>
								</div>
								<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "10px" }}>요청자: {p.requester}</div>
								<div style={{ display: "flex", gap: "6px" }}>
									<button className="btn btn-sm" style={{ flex: 1, background: "rgba(74,222,128,0.12)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.3)" }} onClick={() => processApproval(p.id)}>승인</button>
									<button className="btn btn-sm btn-danger" style={{ flex: 1 }} onClick={() => processApproval(p.id)}>반려</button>
								</div>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	);
}
