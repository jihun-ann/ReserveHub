import { useState } from "react";

const PLATFORMS = {
	pilates: { emoji: "🤸", name: "스튜디오 필라테스", nameFull: "스튜디오 필라테스 강남", sub: "필라테스 · 강남구 역삼동", members: "142명" },
	yoga: { emoji: "🧘", name: "요가라운지", nameFull: "요가라운지 홍대", sub: "요가 · 마포구 서교동", members: "86명" },
	music: { emoji: "🎵", name: "뮤직하우스", nameFull: "뮤직하우스 홍대", sub: "음악 · 마포구 서교동", members: "56명" }
};

const TABS = [
	{ key: "info", label: "기본 정보" },
	{ key: "programs", label: "프로그램/슬롯" },
	{ key: "members", label: "사용자" },
	{ key: "instructors", label: "일반관리자" },
	{ key: "billing", label: "수강권/결제" },
	{ key: "stats", label: "수익/통계" }
];

export default function OwnerPlatformView() {
	const [selectedId, setSelectedId] = useState("pilates");
	const [activeTab, setActiveTab] = useState("info");
	const plat = PLATFORMS[selectedId];

	return (
		<div id="owner-platforms" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / Platforms</div>
				<div className="page-title">플랫폼 관리</div>
				<div className="page-subtitle">플랫폼을 선택해 상세 정보를 관리하세요</div>
			</div>

			{/* 플랫폼 목록 + 상세 */}
			<div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "start" }}>

				{/* 플랫폼 목록 */}
				<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-sub)", letterSpacing: "1px", textTransform: "uppercase" }}>플랫폼 목록</span>
							<button className="btn btn-sm btn-primary" style={{ padding: "5px 10px", fontSize: "11px" }}>+ 추가</button>
						</div>
						<div id="platformList">
							{Object.entries(PLATFORMS).map(([id, p]) => (
								<div
									key={id}
									className={`platform-list-item ${selectedId === id ? "active" : ""}`}
									onClick={() => setSelectedId(id)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "10px",
										padding: "14px 16px",
										cursor: "pointer",
										borderBottom: "1px solid var(--border)",
										background: selectedId === id ? "rgba(124,106,247,0.08)" : "transparent",
										borderLeft: `3px solid ${selectedId === id ? "#7c6af7" : "transparent"}`
									}}
								>
									<span style={{ fontSize: "18px" }}>{p.emoji}</span>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: "13px", fontWeight: 700 }}>{p.name}</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>회원 {p.members}</div>
									</div>
									<span className="plat-status ps-active" style={{ fontSize: "10px", flexShrink: 0 }}>운영</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* 플랫폼 상세 (탭) */}
				<div className="card" style={{ padding: 0, overflow: "hidden" }}>
					{/* 상단 헤더 */}
					<div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<span style={{ fontSize: "22px" }}>{plat.emoji}</span>
							<div>
								<div style={{ fontSize: "16px", fontWeight: 700 }}>{plat.nameFull}</div>
								<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{plat.sub}</div>
							</div>
						</div>
						<div style={{ display: "flex", gap: "8px" }}>
							<button className="btn btn-ghost btn-sm">수정</button>
							<button className="btn btn-sm btn-danger">비활성화</button>
						</div>
					</div>

					{/* 탭 */}
					<div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
						{TABS.map((t) => (
							<button
								key={t.key}
								className={`plat-tab ${activeTab === t.key ? "active" : ""}`}
								onClick={() => setActiveTab(t.key)}
							>
								{t.label}
							</button>
						))}
					</div>

					{/* 탭 컨텐츠 */}
					<div style={{ padding: "20px" }}>

						{/* 기본 정보 */}
						<div style={{ display: activeTab === "info" ? "block" : "none" }}>
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
								<div className="form-field"><label>플랫폼명</label><input type="text" defaultValue={plat.nameFull} /></div>
								<div className="form-field"><label>업종</label><select defaultValue="필라테스"><option>필라테스</option><option>요가</option><option>음악</option><option>헬스</option></select></div>
								<div className="form-field"><label>대표 전화</label><input type="text" defaultValue="02-1234-5678" /></div>
								<div className="form-field"><label>주소</label><input type="text" defaultValue="서울시 강남구 역삼동 123-45" /></div>
								<div className="form-field" style={{ gridColumn: "1/-1" }}><label>소개</label><textarea style={{ minHeight: "60px" }} defaultValue="강남 최고의 필라테스 스튜디오입니다." /></div>
							</div>
							<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
								<button className="btn btn-primary" style={{ background: "#f6ad55", color: "#0f0f13" }}>저장</button>
							</div>
						</div>

						{/* 프로그램/슬롯 */}
						<div style={{ display: activeTab === "programs" ? "block" : "none" }}>
							<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
								<button className="btn btn-primary btn-sm" style={{ background: "#f6ad55", color: "#0f0f13" }}>+ 프로그램 추가</button>
							</div>
							<div style={{ overflowX: "auto" }}>
								<table className="attend-table">
									<thead><tr><th>프로그램명</th><th>유형</th><th>정원</th><th>시간</th><th>상태</th><th></th></tr></thead>
									<tbody>
									<tr><td style={{ fontWeight: 600 }}>그룹반 A — 기초</td><td><span className="plat-chip" style={{ background: "rgba(124,106,247,0.12)", color: "#7c6af7", borderColor: "rgba(124,106,247,0.3)" }}>그룹레슨</span></td><td>8명</td><td>60분</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									<tr><td style={{ fontWeight: 600 }}>그룹반 B — 심화</td><td><span className="plat-chip" style={{ background: "rgba(124,106,247,0.12)", color: "#7c6af7", borderColor: "rgba(124,106,247,0.3)" }}>그룹레슨</span></td><td>8명</td><td>60분</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									<tr><td style={{ fontWeight: 600 }}>1:1 개인레슨</td><td><span className="plat-chip" style={{ background: "rgba(79,209,197,0.12)", color: "#4fd1c5", borderColor: "rgba(79,209,197,0.3)" }}>개인레슨</span></td><td>1명</td><td>50분</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>운영</span></td><td><button className="btn btn-ghost btn-sm">수정</button></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* 사용자 */}
						<div style={{ display: activeTab === "members" ? "block" : "none" }}>
							<div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
								<input type="text" placeholder="이름 / 연락처 검색..." style={{ flex: 1, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "13px", outline: "none" }} />
								<button className="btn btn-primary btn-sm" style={{ background: "#f6ad55", color: "#0f0f13" }}>+ 회원 등록</button>
							</div>
							<div style={{ overflowX: "auto" }}>
								<table className="attend-table">
									<thead><tr><th>이름</th><th>연락처</th><th>등록일</th><th>다음 결제</th><th>상태</th><th></th></tr></thead>
									<tbody>
									<tr><td style={{ fontWeight: 600 }}>홍길동</td><td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>010-1234-5678</td><td>2025.10.01</td><td style={{ color: "#f6ad55", fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>2026.03.01</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style={{ fontWeight: 600 }}>김민지</td><td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>010-9876-5432</td><td>2025.11.15</td><td style={{ color: "#f6ad55", fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>2026.03.15</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style={{ fontWeight: 600 }}>박서준</td><td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>010-5555-4444</td><td>2025.09.01</td><td style={{ color: "#f87171", fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>2026.02.28</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>활성</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									<tr><td style={{ fontWeight: 600 }}>이지은</td><td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>010-2222-3333</td><td>2024.06.01</td><td style={{ color: "var(--text-dim)", fontSize: "12px" }}>만료</td><td><span className="plat-status ps-expired" style={{ fontSize: "10px" }}>만료</span></td><td><button className="btn btn-ghost btn-sm">상세</button></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* 일반관리자 */}
						<div style={{ display: activeTab === "instructors" ? "block" : "none" }}>
							<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
								<button className="btn btn-primary btn-sm" style={{ background: "#f6ad55", color: "#0f0f13" }}>+ 관리자 등록</button>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
								<div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
									<div className="avatar" style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)", width: "38px", height: "38px", fontSize: "15px" }}>이</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: "14px", fontWeight: 700 }}>이수진 트레이너</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>그룹반 A · 그룹반 B · 1:1 개인레슨 담당 · 수강생 18명</div>
									</div>
									<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
									<button className="btn btn-ghost btn-sm">수정</button>
								</div>
								<div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
									<div className="avatar" style={{ background: "linear-gradient(135deg,#f6ad55,#ed8936)", width: "38px", height: "38px", fontSize: "15px" }}>김</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: "14px", fontWeight: 700 }}>김현우 트레이너</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>그룹반 A 보조 · 수강생 12명</div>
									</div>
									<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
									<button className="btn btn-ghost btn-sm">수정</button>
								</div>
							</div>
						</div>

						{/* 수강권/결제 */}
						<div style={{ display: activeTab === "billing" ? "block" : "none" }}>
							<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
								<button className="btn btn-primary btn-sm" style={{ background: "#f6ad55", color: "#0f0f13" }}>+ 수강권 추가</button>
							</div>
							<div style={{ overflowX: "auto" }}>
								<table className="attend-table">
									<thead><tr><th>수강권명</th><th>금액</th><th>기간</th><th>가입자</th><th>상태</th></tr></thead>
									<tbody>
									<tr><td style={{ fontWeight: 600 }}>그룹 월정액</td><td style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>95,000원</td><td>30일</td><td>98명</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>판매중</span></td></tr>
									<tr><td style={{ fontWeight: 600 }}>개인 10회권</td><td style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>350,000원</td><td>60일</td><td>24명</td><td><span className="plat-status ps-active" style={{ fontSize: "10px" }}>판매중</span></td></tr>
									<tr><td style={{ fontWeight: 600 }}>체험 1회권</td><td style={{ fontFamily: "'DM Mono',monospace", color: "#4fd1c5" }}>30,000원</td><td>1일</td><td>20명</td><td><span className="plat-status ps-expired" style={{ fontSize: "10px" }}>중단</span></td></tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* 수익/통계 */}
						<div style={{ display: activeTab === "stats" ? "block" : "none" }}>
							<div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
								<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center", border: "1px solid var(--border)" }}>
									<div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginBottom: "6px" }}>이번 달 매출</div>
									<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: 500, color: "#4fd1c5" }}>9.8만</div>
								</div>
								<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center", border: "1px solid var(--border)" }}>
									<div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginBottom: "6px" }}>신규 가입</div>
									<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: 500, color: "#7c6af7" }}>8명</div>
								</div>
								<div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px", textAlign: "center", border: "1px solid var(--border)" }}>
									<div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginBottom: "6px" }}>재등록률</div>
									<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: 500, color: "#f6ad55" }}>78%</div>
								</div>
							</div>
							{/* 월별 매출 바 */}
							<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>월별 매출 추이</div>
							<div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px" }}>
								{[
									{ label: "10월", height: "60%", opacity: 0.6, color: "#7c6af7" },
									{ label: "11월", height: "70%", opacity: 0.7, color: "#7c6af7" },
									{ label: "12월", height: "75%", opacity: 0.8, color: "#7c6af7" },
									{ label: "1월", height: "80%", opacity: 0.9, color: "#7c6af7" },
									{ label: "2월", height: "100%", opacity: 1, color: "#4fd1c5" }
								].map((bar) => (
									<div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
										<div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
											<div style={{ width: "100%", background: bar.color, borderRadius: "3px 3px 0 0", height: bar.height, opacity: bar.opacity }}></div>
										</div>
										<span style={{ fontSize: "9px", color: bar.label === "2월" ? "var(--accent2)" : "var(--text-dim)" }}>{bar.label}</span>
									</div>
								))}
							</div>
							<div style={{ height: "1px", background: "var(--border)", marginTop: "2px" }}></div>
						</div>

					</div>
				</div>
			</div>
		</div>
	);
}
