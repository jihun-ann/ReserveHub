import { businessTypeLabel } from "../../api/common.js";

export default function OwnerMypageView({ user, platforms }) {
	const activeCount = platforms.filter((p) => p.status === "ACTIVE").length;

	return (
		<div id="owner-mypage" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / My Page</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">오너 계정 정보를 확인하세요</div>
			</div>

			<div className="mypage-hero" style={{ marginBottom: "24px" }}>
				<div className="hero-avatar">
					{user?.email?.[0]?.toUpperCase() || "?"}
				</div>
				<div className="hero-identity">
					<div className="hero-name">{user?.email || "알 수 없음"}</div>
					<div className="hero-email">{user?.role === "OWNER" ? "대표 (Owner)" : user?.role}</div>
				</div>
				<div className="hero-divider"></div>
				<div className="hero-stats">
					<div className="hero-stat">
						<div className="hstat-val">{platforms.length}</div>
						<div className="hstat-key">관리 플랫폼</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val">{activeCount}</div>
						<div className="hstat-key">운영 중</div>
					</div>
				</div>
			</div>

			<div className="card">
				<div className="card-title">관리 플랫폼</div>
				{platforms.length === 0 && (
					<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>등록된 플랫폼이 없습니다</div>
				)}
				{platforms.map((p) => (
					<div className="platform-item" key={p.id}>
						<div className="plat-emoji">{p.emoji}</div>
						<div className="plat-detail">
							<div className="plat-name">{p.name}</div>
							<span className="plat-tag">{businessTypeLabel(p.businessType)}</span>
						</div>
						<span className={`plat-status ${p.status === "ACTIVE" ? "ps-active" : "ps-expired"}`}>{p.status === "ACTIVE" ? "운영 중" : p.status}</span>
					</div>
				))}
			</div>
		</div>
	);
}
