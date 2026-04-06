export default function SuperDashboardView(){
	return(<div id="super-dashboard" className="page active">
		<div className="page-header">
			<div className="page-label">Super Admin / Dashboard</div>
			<div className="page-title">대시보드</div>
			<div className="page-subtitle">전체 플랫폼 현황을 한눈에 확인하세요</div>
		</div>

		<!-- KPI 4칸 -->
		<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
			<div className="card" style="padding:20px;text-align:center;">
				<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">활성 플랫폼</div>
				<div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#f6ad55;line-height:1;">3</div>
				<div style="font-size:11px;color:var(--green);margin-top:6px;">+1 이번 달</div>
			</div>
			<div className="card" style="padding:20px;text-align:center;">
				<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">전체 회원</div>
				<div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#7c6af7;line-height:1;">284</div>
				<div style="font-size:11px;color:var(--green);margin-top:6px;">+12 이번 달</div>
			</div>
			<div className="card" style="padding:20px;text-align:center;">
				<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">이번 달 매출</div>
				<div style="font-family:'DM Mono',monospace;font-size:28px;font-weight:500;color:#4fd1c5;line-height:1;">18.4<span style="font-size:14px;">만</span></div>
				<div style="font-size:11px;color:var(--green);margin-top:6px;">↑ 9% vs 지난달</div>
			</div>
			<div className="card" style="padding:20px;text-align:center;">
				<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">대기 승인</div>
				<div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#f87171;line-height:1;">2</div>
				<div style="font-size:11px;color:var(--red);margin-top:6px;">처리 필요</div>
			</div>
		</div>

		<!-- 플랫폼별 현황 + 승인 대기 -->
		<div style="display:grid;grid-template-columns:1fr 340px;gap:20px;">

			<!-- 플랫폼 현황 테이블 -->
			<div className="card">
				<div className="card-title">플랫폼별 현황</div>
				<div style="overflow-x:auto;">
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
						<tr style="cursor:pointer;" onClick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('pilates')">
							<td>
								<div style="display:flex;align-items:center;gap:8px;">
									<span style="display:inline-block;width:10px;height:10px;background:#7c6af7;border-radius:2px;flex-shrink:0;"></span>
									<div><div style="font-weight:700;font-size:13px;">스튜디오 필라테스 강남</div><div style="font-size:11px;color:var(--text-sub);">필라테스</div></div>
								</div>
							</td>
							<td><span style="font-family:'DM Mono',monospace;">142명</span></td>
							<td><span style="font-family:'DM Mono',monospace;">4명</span></td>
							<td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">9.8만</span></td>
							<td>
								<div style="display:flex;align-items:center;gap:6px;">
									<div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:93%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
									<span style="font-size:11px;color:#4fd1c5;">93%</span>
								</div>
							</td>
							<td><span className="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
						</tr>
						<tr style="cursor:pointer;" onClick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('yoga')">
							<td>
								<div style="display:flex;align-items:center;gap:8px;">
									<span style="display:inline-block;width:10px;height:10px;background:#4fd1c5;border-radius:2px;flex-shrink:0;"></span>
									<div><div style="font-weight:700;font-size:13px;">요가라운지 홍대</div><div style="font-size:11px;color:var(--text-sub);">요가</div></div>
								</div>
							</td>
							<td><span style="font-family:'DM Mono',monospace;">86명</span></td>
							<td><span style="font-family:'DM Mono',monospace;">2명</span></td>
							<td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">5.2만</span></td>
							<td>
								<div style="display:flex;align-items:center;gap:6px;">
									<div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:88%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
									<span style="font-size:11px;color:#4fd1c5;">88%</span>
								</div>
							</td>
							<td><span className="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
						</tr>
						<tr style="cursor:pointer;" onClick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('music')">
							<td>
								<div style="display:flex;align-items:center;gap:8px;">
									<span style="display:inline-block;width:10px;height:10px;background:#f6ad55;border-radius:2px;flex-shrink:0;"></span>
									<div><div style="font-weight:700;font-size:13px;">뮤직하우스 홍대</div><div style="font-size:11px;color:var(--text-sub);">음악</div></div>
								</div>
							</td>
							<td><span style="font-family:'DM Mono',monospace;">56명</span></td>
							<td><span style="font-family:'DM Mono',monospace;">3명</span></td>
							<td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">3.4만</span></td>
							<td>
								<div style="display:flex;align-items:center;gap:6px;">
									<div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:79%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
									<span style="font-size:11px;color:#4fd1c5;">79%</span>
								</div>
							</td>
							<td><span className="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
						</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- 승인 대기 빠른 처리 -->
			<div className="card">
				<div className="card-title" style="display:flex;align-items:center;justify-content:space-between;">
					<span>승인 대기</span>
					<span style="background:rgba(248,113,113,0.15);color:#f87171;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;">2건</span>
				</div>
				<div style="display:flex;flex-direction:column;gap:10px;">
					<div style="background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);padding:14px;">
						<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
							<div>
								<div style="font-size:13px;font-weight:700;">홍길동 — 1:1 레슨 변경</div>
								<div style="font-size:11px;color:var(--text-sub);margin-top:2px;">02.26 10:00 → 02.28 14:00</div>
								<div style="margin-top:4px;"><span className="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 필라테스</span></div>
							</div>
						</div>
						<div style="font-size:11px;color:var(--text-sub);margin-bottom:10px;">요청자: 이수진 트레이너</div>
						<div style="display:flex;gap:6px;">
							<button className="btn btn-sm" style="flex:1;background:rgba(74,222,128,0.12);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onClick="approveRequest(this)">승인</button>
							<button className="btn btn-sm btn-danger" style="flex:1;" onClick="rejectRequest(this)">반려</button>
						</div>
					</div>
					<div style="background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);padding:14px;">
						<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
							<div>
								<div style="font-size:13px;font-weight:700;">최유나 — 그룹반 B 변경</div>
								<div style="font-size:11px;color:var(--text-sub);margin-top:2px;">02.26 14:00 → 03.01 14:00</div>
								<div style="margin-top:4px;"><span className="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">🧘 요가</span></div>
							</div>
						</div>
						<div style="font-size:11px;color:var(--text-sub);margin-bottom:10px;">요청자: 이수진 트레이너</div>
						<div style="display:flex;gap:6px;">
							<button className="btn btn-sm" style="flex:1;background:rgba(74,222,128,0.12);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onClick="approveRequest(this)">승인</button>
							<button className="btn btn-sm btn-danger" style="flex:1;" onClick="rejectRequest(this)">반려</button>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>)
}