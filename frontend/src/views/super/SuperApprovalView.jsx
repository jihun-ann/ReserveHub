export default function SuperApprovalView(){
	return(
		<div id="super-approval" className="page">
			<div className="page-header">
				<div className="page-label">Super Admin / Approval</div>
				<div className="page-title">승인 관리</div>
				<div className="page-subtitle">일반관리자의 일정 변경 요청을 검토하고 승인하세요</div>
			</div>

			<!-- 필터 -->
			<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
				<button className="filter-chip active">전체</button>
				<button className="filter-chip">대기 중</button>
				<button className="filter-chip">승인됨</button>
				<button className="filter-chip">반려됨</button>
				<div style="flex:1;min-width:160px;"><input type="text" placeholder="이름 / 플랫폼 검색..." style="width:100%;padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:12px;outline:none;"/></div>
			</div>

			<div style="display:flex;flex-direction:column;gap:12px;">

				<!-- 대기 -->
				<div className="card" style="border-left:3px solid #f6ad55;">
					<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
						<div>
							<div style="font-size:14px;font-weight:700;">홍길동 — 1:1 개인 레슨 일정 변경</div>
							<div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
								<span className="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 스튜디오 필라테스</span>
								<span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
								<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.25</span>
							</div>
						</div>
						<span className="res-status" style="background:rgba(246,173,85,0.12);color:var(--accent3);flex-shrink:0;">대기 중</span>
					</div>
					<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
						<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">기존 일정</div><div style="font-size:13px;font-weight:600;">2026.02.26 10:00</div></div>
						<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">변경 희망</div><div style="font-size:13px;font-weight:600;color:#4fd1c5;">2026.02.28 14:00</div></div>
					</div>
					<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px;color:var(--text-sub);line-height:1.5;">수강생 개인 사정으로 인한 일정 조정 요청입니다.</div>
					<div style="display:flex;gap:8px;justify-content:flex-end;">
						<button className="btn btn-ghost btn-sm">메모 추가</button>
						<button className="btn btn-sm btn-danger" onClick="rejectRequest(this)">반려</button>
						<button className="btn btn-sm" style="background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onClick="approveRequest(this)">승인</button>
					</div>
				</div>

				<div className="card" style="border-left:3px solid #f6ad55;">
					<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
						<div>
							<div style="font-size:14px;font-weight:700;">최유나 — 그룹반 B 일정 변경</div>
							<div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
								<span className="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">🧘 요가라운지</span>
								<span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
								<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.25</span>
							</div>
						</div>
						<span className="res-status" style="background:rgba(246,173,85,0.12);color:var(--accent3);flex-shrink:0;">대기 중</span>
					</div>
					<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
						<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">기존 일정</div><div style="font-size:13px;font-weight:600;">2026.02.26 14:00</div></div>
						<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">변경 희망</div><div style="font-size:13px;font-weight:600;color:#4fd1c5;">2026.03.01 14:00</div></div>
					</div>
					<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px;color:var(--text-sub);line-height:1.5;">수강생 업무 일정 충돌로 인한 변경 요청입니다.</div>
					<div style="display:flex;gap:8px;justify-content:flex-end;">
						<button className="btn btn-ghost btn-sm">메모 추가</button>
						<button className="btn btn-sm btn-danger" onClick="rejectRequest(this)">반려</button>
						<button className="btn btn-sm" style="background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onClick="approveRequest(this)">승인</button>
					</div>
				</div>

				<!-- 처리 완료 -->
				<div className="card" style="border-left:3px solid var(--green);opacity:0.7;">
					<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
						<div>
							<div style="font-size:14px;font-weight:700;">김민지 — 그룹반 A 일정 변경</div>
							<div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
								<span className="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 스튜디오 필라테스</span>
								<span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
								<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.18</span>
							</div>
						</div>
						<span className="res-status rs-completed">승인됨</span>
					</div>
					<div style="font-size:12px;color:var(--text-dim);font-family:'DM Mono',monospace;">2026.02.20 09:00 → 2026.02.22 09:00 · 승인일: 2026.02.19</div>
				</div>

			</div>
		</div>
	)
}