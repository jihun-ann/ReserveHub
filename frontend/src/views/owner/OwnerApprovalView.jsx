import { useState } from "react";

const REQUESTS = [
	{
		id: "r1",
		title: "홍길동 — 1:1 개인 레슨 일정 변경",
		platformLabel: "🤸 스튜디오 필라테스",
		platformStyle: { background: "rgba(124,106,247,0.12)", color: "#7c6af7", borderColor: "rgba(124,106,247,0.3)" },
		requester: "이수진 트레이너",
		date: "2026.02.25",
		from: "2026.02.26 10:00",
		to: "2026.02.28 14:00",
		reason: "수강생 개인 사정으로 인한 일정 조정 요청입니다.",
		status: "pending"
	},
	{
		id: "r2",
		title: "최유나 — 그룹반 B 일정 변경",
		platformLabel: "🧘 요가라운지",
		platformStyle: { background: "rgba(79,209,197,0.12)", color: "#4fd1c5", borderColor: "rgba(79,209,197,0.3)" },
		requester: "이수진 트레이너",
		date: "2026.02.25",
		from: "2026.02.26 14:00",
		to: "2026.03.01 14:00",
		reason: "수강생 업무 일정 충돌로 인한 변경 요청입니다.",
		status: "pending"
	},
	{
		id: "r3",
		title: "김민지 — 그룹반 A 일정 변경",
		platformLabel: "🤸 스튜디오 필라테스",
		platformStyle: { background: "rgba(124,106,247,0.12)", color: "#7c6af7", borderColor: "rgba(124,106,247,0.3)" },
		requester: "이수진 트레이너",
		date: "2026.02.18",
		from: "2026.02.20 09:00",
		to: "2026.02.22 09:00",
		reason: "",
		status: "approved",
		processedAt: "2026.02.19"
	}
];

export default function OwnerApprovalView() {
	const [requests, setRequests] = useState(REQUESTS);
	const [filter, setFilter] = useState("all");

	function processRequest(id, status) {
		setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, processedAt: "2026.02.26" } : r)));
	}

	const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

	return (
		<div id="owner-approval" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / Approval</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일반관리자의 일정 변경 요청을 검토하고 승인하세요</div>
			</div>

			{/* 필터 */}
			<div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
				<button className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>전체</button>
				<button className={`filter-chip ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>대기 중</button>
				<button className={`filter-chip ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>승인됨</button>
				<button className={`filter-chip ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>반려됨</button>
				<div style={{ flex: 1, minWidth: "160px" }}>
					<input type="text" placeholder="이름 / 플랫폼 검색..." style={{ width: "100%", padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", color: "var(--text)", fontSize: "12px", outline: "none" }} />
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{visible.map((r) => (
					<div
						key={r.id}
						className="card"
						style={{
							borderLeft: `3px solid ${r.status === "pending" ? "#f6ad55" : r.status === "approved" ? "var(--green)" : "var(--red)"}`,
							opacity: r.status === "pending" ? 1 : 0.7
						}}
					>
						<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: r.status === "pending" ? "12px" : "10px", flexWrap: "wrap" }}>
							<div>
								<div style={{ fontSize: "14px", fontWeight: 700 }}>{r.title}</div>
								<div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
									<span className="plat-chip" style={r.platformStyle}>{r.platformLabel}</span>
									<span style={{ fontSize: "11px", color: "var(--text-sub)" }}>요청자: {r.requester}</span>
									<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "var(--text-dim)" }}>{r.date}</span>
								</div>
							</div>
							{r.status === "pending" ? (
								<span className="res-status" style={{ background: "rgba(246,173,85,0.12)", color: "var(--accent3)", flexShrink: 0 }}>대기 중</span>
							) : (
								<span className={`res-status ${r.status === "approved" ? "rs-completed" : "rs-canceled"}`}>
									{r.status === "approved" ? "승인됨" : "반려됨"}
								</span>
							)}
						</div>
						{r.status === "pending" ? (
							<>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>기존 일정</div>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{r.from}</div>
									</div>
									<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
										<div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "1px" }}>변경 희망</div>
										<div style={{ fontSize: "13px", fontWeight: 600, color: "#4fd1c5" }}>{r.to}</div>
									</div>
								</div>
								<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: "12px", fontSize: "13px", color: "var(--text-sub)", lineHeight: 1.5 }}>{r.reason}</div>
								<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
									<button className="btn btn-ghost btn-sm">메모 추가</button>
									<button className="btn btn-sm btn-danger" onClick={() => processRequest(r.id, "rejected")}>반려</button>
									<button
										className="btn btn-sm"
										style={{ background: "rgba(74,222,128,0.15)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.3)" }}
										onClick={() => processRequest(r.id, "approved")}
									>
										승인
									</button>
								</div>
							</>
						) : (
							<div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace" }}>
								{r.from} → {r.to} · 처리일: {r.processedAt}
							</div>
						)}
					</div>
				))}
				{visible.length === 0 && (
					<div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-dim)" }}>해당 조건의 요청이 없습니다</div>
				)}
			</div>
		</div>
	);
}
