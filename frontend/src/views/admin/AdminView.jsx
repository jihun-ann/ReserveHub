import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { getCurrentUser, loadCurrentUser, clearSession } from "../../api/http.js";
import {
	businessTypeLabel, listPlatformApplicationsForAdmin, approvePlatformApplication,
	rejectPlatformApplication, openPlatformCertificate, APPLICATION_STATUS, formatBusinessNumber
} from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import { getTheme, toggleTheme } from "../../theme.js";

const TABS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const inputStyle = {
	width: "100%", padding: "8px 10px", background: "var(--surface2)", border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box", resize: "vertical"
};
const metaStyle = { fontSize: "12px", color: "var(--text-sub)", lineHeight: 1.6 };

// 서비스 운영자 전용 화면 — 플랫폼 개설 신청의 사업자등록증을 확인하고 승인/반려한다.
// 승인하면 플랫폼이 만들어지고 신청자가 그 플랫폼의 오너가 된다. 권한은 서버(@PreAuthorize ADMIN)가 다시 검증한다.
export default function AdminView() {
	const navigate = useNavigate();
	const [ready, setReady] = useState(false);
	const [tab, setTab] = useState("PENDING");
	const [items, setItems] = useState([]);
	const [memos, setMemos] = useState({});
	const [busyId, setBusyId] = useState(null);
	const [error, setError] = useState("");
	const [theme, setTheme] = useState(getTheme());

	useEffect(() => {
		(async () => {
			const me = getCurrentUser()?.role ? getCurrentUser() : await loadCurrentUser();
			if (!me) navigate("/login", { replace: true });
			else if (me.role !== "ADMIN") navigate("/app", { replace: true });
			else setReady(true);
		})();
	}, [navigate]);

	const load = useCallback(() => {
		setError("");
		listPlatformApplicationsForAdmin(tab)
			.then(setItems)
			.catch((err) => { setItems([]); setError(err.message || "목록을 불러오지 못했습니다."); });
	}, [tab]);
	useEffect(() => {
		if (ready) load();
	}, [ready, load]);

	async function decide(item, approve) {
		const memo = memos[item.application.id]?.trim() || "";
		if (!approve && !memo) {
			setError("반려 사유를 입력해 주세요. 신청자에게 그대로 보입니다.");
			return;
		}
		if (!window.confirm(`'${item.application.name}' 신청을 ${approve ? "승인" : "반려"}할까요?`)) return;
		setBusyId(item.application.id);
		setError("");
		try {
			if (approve) await approvePlatformApplication(item.application.id, memo || null);
			else await rejectPlatformApplication(item.application.id, memo);
			load();
		} catch (err) {
			setError(err.message || "처리에 실패했습니다.");
		} finally {
			setBusyId(null);
		}
	}

	function logout() {
		clearSession();
		navigate("/login");
	}

	if (!ready) return null;

	return (
		<div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
			<header style={{
				display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
				padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)"
			}}>
				<div style={{ fontWeight: 600, fontSize: "15px" }}>ReserveHub 운영자</div>
				<div style={{ display: "flex", gap: "8px" }}>
					<button className="btn btn-sm btn-ghost" title="테마 전환" onClick={() => setTheme(toggleTheme())}>
						{theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
					</button>
					<button className="btn btn-sm btn-ghost" onClick={logout}><LogOut size={16} strokeWidth={1.5} /> 로그아웃</button>
				</div>
			</header>

			<main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 16px" }}>
				<div className="page-header">
					<div className="page-title">플랫폼 개설 심사</div>
					<div className="page-subtitle">사업자등록증과 신청 정보를 확인하고 승인하면 신청자가 그 플랫폼의 오너가 됩니다</div>
				</div>

				<div role="tablist" style={{ display: "flex", gap: "8px", margin: "16px 0", flexWrap: "wrap" }}>
					{TABS.map((s) => (
						<button
							key={s} role="tab" aria-selected={tab === s}
							className={`btn btn-sm ${tab === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab(s)}
						>
							{APPLICATION_STATUS[s].label}
						</button>
					))}
				</div>

				{error && <div style={{ color: "var(--red)", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{items.length === 0 && (
						<div style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>신청이 없습니다</div>
					)}
					{items.map((item) => {
						const a = item.application;
						return (
							<div key={a.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
								<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
									<div style={{ flex: "1 1 260px", minWidth: 0 }}>
										<div style={{ fontSize: "15px", fontWeight: 600 }}>{a.name}</div>
										<div style={metaStyle}>
											{businessTypeLabel(a.businessType)} · 사업자번호 <b>{formatBusinessNumber(a.businessNumber)}</b><br />
											{a.phone && <>전화 {a.phone}<br /></>}
											{a.address && <>주소 {a.address}<br /></>}
											{a.description && <>소개 {a.description}<br /></>}
											<span style={{ color: "var(--text-dim)" }}>{formatDateTime(a.createdAt)} 신청</span>
										</div>
									</div>
									<div style={{ flex: "1 1 200px", minWidth: 0 }}>
										<div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-sub)" }}>신청자</div>
										<div style={metaStyle}>
											{item.applicantName || "알 수 없음"} ({item.applicantUsername})<br />
											{item.applicantEmail}<br />
											{item.applicantPhone}
										</div>
									</div>
								</div>

								<div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
									<button className="btn btn-sm btn-ghost" onClick={() => openPlatformCertificate(a.id).catch((err) => setError(err.message))}>
										사업자등록증 보기
									</button>
									<span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{a.certificateName}</span>
								</div>

								{a.status === "PENDING" ? (
									<>
										<textarea
											rows={2} maxLength={500} placeholder="메모 (반려 시 필수 — 신청자에게 보입니다)"
											aria-label="심사 메모"
											value={memos[a.id] || ""} onChange={(e) => setMemos({ ...memos, [a.id]: e.target.value })} style={inputStyle}
										/>
										<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
											<button className="btn btn-sm btn-danger" disabled={busyId === a.id} onClick={() => decide(item, false)}>반려</button>
											<button className="btn btn-sm btn-primary" disabled={busyId === a.id} onClick={() => decide(item, true)}>승인</button>
										</div>
									</>
								) : (
									<div style={metaStyle}>
										<span style={{ fontWeight: 600, color: APPLICATION_STATUS[a.status]?.color }}>{APPLICATION_STATUS[a.status]?.label}</span>
										{a.decidedAt && ` · ${formatDateTime(a.decidedAt)}`}
										{a.decisionMemo && ` · ${a.decisionMemo}`}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</main>
		</div>
	);
}
