export default function SuperPlatformView(){
	return(
		<div id="super-platforms" className="page">
			<div className="page-header">
				<div className="page-label">Super Admin / Platforms</div>
				<div className="page-title">플랫폼 관리</div>
				<div className="page-subtitle">플랫폼을 선택해 상세 정보를 관리하세요</div>
			</div>

			<!-- 플랫폼 목록 + 상세 -->
			<div style="display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:start;">

				<!-- 플랫폼 목록 -->
				<div style="display:flex;flex-direction:column;gap:0;">
					<div className="card" style="padding:0;overflow:hidden;">
						<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
							<span style="font-size:11px;font-weight:600;color:var(--text-sub);letter-spacing:1px;text-transform:uppercase;">플랫폼 목록</span>
							<button className="btn btn-sm btn-primary" style="padding:5px 10px;font-size:11px;">+ 추가</button>
						</div>
						<div id="platformList">
							<div className="platform-list-item active" onClick="selectPlatform('pilates')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--border);background:rgba(124,106,247,0.08);border-left:3px solid #7c6af7;">
								<span style="font-size:18px;">🤸</span>
								<div style="flex:1;min-width:0;">
									<div style="font-size:13px;font-weight:700;">스튜디오 필라테스</div>
									<div style="font-size:11px;color:var(--text-sub);">강남 · 회원 142명</div>
								</div>
								<span className="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
							</div>
							<div className="platform-list-item" onClick="selectPlatform('yoga')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--border);border-left:3px solid transparent;">
								<span style="font-size:18px;">🧘</span>
								<div style="flex:1;min-width:0;">
									<div style="font-size:13px;font-weight:700;">요가라운지</div>
									<div style="font-size:11px;color:var(--text-sub);">홍대 · 회원 86명</div>
								</div>
								<span className="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
							</div>
							<div className="platform-list-item" onClick="selectPlatform('music')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-left:3px solid transparent;">
								<span style="font-size:18px;">🎵</span>
								<div style="flex:1;min-width:0;">
									<div style="font-size:13px;font-weight:700;">뮤직하우스</div>
									<div style="font-size:11px;color:var(--text-sub);">홍대 · 회원 56명</div>
								</div>
								<span className="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
							</div>
						</div>
					</div>
				</div>

				<!-- 플랫폼 상세 (탭) -->
				<div className="card" style="padding:0;overflow:hidden;">
					<!-- 상단 헤더 -->
					<div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
						<div style="display:flex;align-items:center;gap:10px;">
							<span style="font-size:22px;" id="platDetailEmoji">🤸</span>
							<div>
								<div style="font-size:16px;font-weight:700;" id="platDetailName">스튜디오 필라테스 강남</div>
								<div style="font-size:11px;color:var(--text-sub);" id="platDetailSub">필라테스 · 강남구 역삼동</div>
							</div>
						</div>
						<div style="display:flex;gap:8px;">
							<button className="btn btn-ghost btn-sm">수정</button>
							<button className="btn btn-sm btn-danger">비활성화</button>
						</div>
					</div>

					<!-- 탭 -->
					<div style="display:flex;border-bottom:1px solid var(--border);overflow-x:auto;" id="platTabs">
						<button className="plat-tab active" onClick="selectPlatTab('info',this)">기본 정보</button>
						<button className="plat-tab" onClick="selectPlatTab('programs',this)">프로그램/슬롯</button>
						<button className="plat-tab" onClick="selectPlatTab('members',this)">사용자</button>
						<button className="plat-tab" onClick="selectPlatTab('instructors',this)">일반관리자</button>
						<button className="plat-tab" onClick="selectPlatTab('billing',this)">수강권/결제</button>
						<button className="plat-tab" onClick="selectPlatTab('stats',this)">수익/통계</button>
					</div>

					<!-- 탭 컨텐츠 -->
					<div style="padding:20px;" id="platTabContent">

						<!-- 기본 정보 -->
						<div id="tab-info" className="plat-tab-content">
							<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
								<div className="form-field"><label>플랫폼명</label><input type="text" value="스튜디오 필라테스 강남"/></div>
								<div className="form-field"><label>업종</label><select><option selected>필라테스</option><option>요가</option><option>음악</option><option>헬스</option></select></div>
								<div className="form-field"><label>대표 전화</label><input type="text" value="02-1234-5678"/></div>
								<div className="form-field"><label>주소</label><input type="text" value="서울시 강남구 역삼동 123-45"/></div>
								<div className="form-field" style="grid-column:1/-1;"><label>소개</label><textarea style="min-height:60px;">강남 최고의 필라테스 스튜디오입니다.</textarea></div>
							</div>
							<div style="display:flex;justify-content:flex-end;margin-top:14px;">
								<button className="btn btn-primary" style="background:#f6ad55;color:#0f0f13;">저장</button>
							</div>
						</div>

						<!-- 프로그램/슬롯 -->
						<div id="tab-programs" className="plat-tab-content" style="display:none;">
							<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
								<button className="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 프로그램 추가</button>
							</div>
							<div style="overflow-x:auto;">
								<table className="attend-table">
									<thead><tr><th>프로그램명</th><th>유형</th><th>정원</th><th>시간</th><th>상태</th><th></th></tr></thead>
									<tbody>
									<tr><td style="font-weight:600;">그룹반 A — 기초</td><td><span className="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">그룹레슨</span></td><td>8명</td><td>60분</td><td><span className="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									<tr><td style="font-weight:600;">그룹반 B — 심화</td><td><span className="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">그룹레슨</span></td><td>8명</td><td>60분</td><td><span className="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									<tr><td style="font-weight:600;">1:1 개인레슨</td><td><span className="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">개인레슨</span></td><td>1명</td><td>50분</td><td><span className="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- 사용자 -->
						<div id="tab-members" className="plat-tab-content" style="display:none;">
							<div style="display:flex;gap:8px;margin-bottom:14px;">
								<input type="text" placeholder="이름 / 연락처 검색..." style="flex:1;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;outline:none;"/>
								<button className="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 회원 등록</button>
							</div>
							<div style="overflow-x:auto;">
								<table className="attend-table">
									<thead><tr><th>이름</th><th>연락처</th><th>등록일</th><th>다음 결제</th><th>상태</th><th></th></tr></thead>
									<tbody>
									<tr><td style="font-weight:600;">홍길동</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-1234-5678</td><td>2025.10.01</td><td style="color:#f6ad55;font-family:'DM Mono',monospace;font-size:12px;">2026.03.01</td><td><span className="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style="font-weight:600;">김민지</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-9876-5432</td><td>2025.11.15</td><td style="color:#f6ad55;font-family:'DM Mono',monospace;font-size:12px;">2026.03.15</td><td><span className="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style="font-weight:600;">박서준</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-5555-4444</td><td>2025.09.01</td><td style="color:#f87171;font-family:'DM Mono',monospace;font-size:12px;">2026.02.28</td><td><span className="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style="font-weight:600;">이지은</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-2222-3333</td><td>2024.06.01</td><td style="color:var(--text-dim);font-size:12px;">만료</td><td><span className="plat-status ps-expired" style="font-size:10px;">만료</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- 일반관리자 -->
						<div id="tab-instructors" className="plat-tab-content" style="display:none;">
							<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
								<button className="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 관리자 등록</button>
							</div>
							<div style="display:flex;flex-direction:column;gap:10px;">
								<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;align-items:center;gap:14px;">
									<div className="avatar" style="background:linear-gradient(135deg,var(--accent2),#667eea);width:38px;height:38px;font-size:15px;">이</div>
									<div style="flex:1;">
										<div style="font-size:14px;font-weight:700;">이수진 트레이너</div>
										<div style="font-size:11px;color:var(--text-sub);margin-top:2px;">그룹반 A · 그룹반 B · 1:1 개인레슨 담당 · 수강생 18명</div>
									</div>
									<span className="plat-status ps-active" style="font-size:10px;">재직</span>
									<button className="btn btn-ghost btn-sm">수정</button>
								</div>
								<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;align-items:center;gap:14px;">
									<div className="avatar" style="background:linear-gradient(135deg,#f6ad55,#ed8936);width:38px;height:38px;font-size:15px;">김</div>
									<div style="flex:1;">
										<div style="font-size:14px;font-weight:700;">김현우 트레이너</div>
										<div style="font-size:11px;color:var(--text-sub);margin-top:2px;">그룹반 A 보조 · 수강생 12명</div>
									</div>
									<span className="plat-status ps-active" style="font-size:10px;">재직</span>
									<button className="btn btn-ghost btn-sm">수정</button>
								</div>
							</div>
						</div>

						<!-- 수강권/결제 -->
						<div id="tab-billing" className="plat-tab-content" style="display:none;">
							<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
								<button className="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 수강권 추가</button>
							</div>
							<div style="overflow-x:auto;">
								<table className="attend-table">
									<thead><tr><th>수강권명</th><th>금액</th><th>기간</th><th>가입자</th><th>상태</th></tr></thead>
									<tbody>
									<tr><td style="font-weight:600;">그룹 월정액</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">95,000원</td><td>30일</td><td>98명</td><td><span className="plat-status ps-active" style="font-size:10px;">판매중</span></td></tr>
									<tr><td style="font-weight:600;">개인 10회권</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">350,000원</td><td>60일</td><td>24명</td><td><span className="plat-status ps-active" style="font-size:10px;">판매중</span></td></tr>
									<tr><td style="font-weight:600;">체험 1회권</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">30,000원</td><td>1일</td><td>20명</td><td><span className="plat-status ps-expired" style="font-size:10px;">중단</span></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- 수익/통계 -->
						<div id="tab-stats" className="plat-tab-content" style="display:none;">
							<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
								<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
									<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">이번 달 매출</div>
									<div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#4fd1c5;">9.8만</div>
								</div>
								<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
									<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">신규 가입</div>
									<div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#7c6af7;">8명</div>
								</div>
								<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
									<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">재등록률</div>
									<div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#f6ad55;">78%</div>
								</div>
							</div>
							<!-- 월별 매출 바 -->
							<div style="font-size:11px;color:var(--text-sub);margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">월별 매출 추이</div>
							<div style="display:flex;align-items:flex-end;gap:8px;height:80px;">
								<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
									<div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:60%;opacity:0.6;"></div></div>
									<span style="font-size:9px;color:var(--text-dim);">10월</span>
								</div>
								<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
									<div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:70%;opacity:0.7;"></div></div>
									<span style="font-size:9px;color:var(--text-dim);">11월</span>
								</div>
								<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
									<div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:75%;opacity:0.8;"></div></div>
									<span style="font-size:9px;color:var(--text-dim);">12월</span>
								</div>
								<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
									<div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:80%;opacity:0.9;"></div></div>
									<span style="font-size:9px;color:var(--text-dim);">1월</span>
								</div>
								<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
									<div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#4fd1c5;border-radius:3px 3px 0 0;height:100%;"></div></div>
									<span style="font-size:9px;color:var(--accent2);">2월</span>
								</div>
							</div>
							<div style="height:1px;background:var(--border);margin-top:2px;"></div>
						</div>

					</div>
				</div>
			</div>
		</div>
	)
}