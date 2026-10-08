import { useCallback, useEffect, useRef, useState } from "react";
import { searchPlatforms, applyJoinRequest, listMyJoinRequests, cancelJoinRequest, businessTypeLabel } from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";

const STATUS = {
	PENDING: { label: "대기 중", color: "var(--text-sub)" },
	APPROVED: { label: "승인됨", color: "var(--green)" },
	REJECTED: { label: "반려됨", color: "var(--red)" },
	CANCELLED: { label: "취소됨", color: "var(--text-dim)" }
};

const inputStyle = {
	padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "14px", outline: "none"
};
const buttonStyle = {
	padding: "9px 16px", border: "none", borderRadius: "var(--radius-sm)", background: "var(--cta)",
	color: "white", fontWeight: 600, fontSize: "13px", cursor: "pointer"
};
const ghostButtonStyle = { ...buttonStyle, background: "transparent", color: "var(--text-sub)", border: "1px solid var(--border)" };
const cardStyle = {
	background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
	padding: "16px", display: "flex", flexDirection: "column", gap: "10px"
};

// 회원이 플랫폼을 이름 또는 ID로 찾아 가입을 신청하는 화면 — 플랫폼이 하나도 없는 계정의 기본 화면이기도 하다.
// 센터가 승인한 뒤 수강권/프로그램을 등록하면 그 플랫폼이 내 플랫폼 목록에 나타난다.
export default function UserJoinPlatformView() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState(null); // null=아직 검색 안 함
	const [searchError, setSearchError] = useState("");
	const [applyingId, setApplyingId] = useState(null); // 신청 메모를 쓰는 중인 플랫폼 id
	const [message, setMessage] = useState("");
	const [mine, setMine] = useState([]);
	const [notice, setNotice] = useState("");
	const [busy, setBusy] = useState(false);
	const noticeTimer = useRef(null);

	const loadMine = useCallback(() => {
		listMyJoinRequests().then(setMine).catch(() => setMine([]));
	}, []);
	useEffect(() => {
		loadMine();
		return () => clearTimeout(noticeTimer.current);
	}, [loadMine]);

	function notify(text) {
		setNotice(text);
		clearTimeout(noticeTimer.current);
		noticeTimer.current = setTimeout(() => setNotice(""), 3000);
	}

	async function search(e) {
		e.preventDefault();
		setSearchError("");
		setApplyingId(null);
		try {
			setResults(await searchPlatforms(query.trim()));
		} catch (err) {
			setResults(null);
			setSearchError(err.message || "검색에 실패했습니다.");
		}
	}

	async function apply(platform) {
		setBusy(true);
		try {
			await applyJoinRequest(platform.id, message.trim() || null);
			setApplyingId(null);
			setMessage("");
			loadMine();
			notify(`'${platform.name}'에 가입을 신청했습니다. 센터의 승인을 기다려 주세요.`);
		} catch (err) {
			notify(err.message || "신청에 실패했습니다.");
		} finally {
			setBusy(false);
		}
	}

	async function cancel(request) {
		if (!window.confirm(`'${request.platformName}' 가입 신청을 취소할까요?`)) return;
		try {
			await cancelJoinRequest(request.id);
			loadMine();
			notify("신청을 취소했습니다.");
		} catch (err) {
			notify(err.message || "취소에 실패했습니다.");
		}
	}

	return (
		<div className="page" id="page-join-platform">
			<div className="page-header">
				<div className="page-label">FIND PLATFORM</div>
				<div className="page-title">플랫폼 찾기</div>
				<div className="page-subtitle">다니고 싶은 센터를 이름이나 플랫폼 ID로 찾아 가입을 신청하세요</div>
			</div>

			{notice && <div style={{ color: "var(--green)", fontSize: "13px", marginBottom: "12px" }}>{notice}</div>}

			<form onSubmit={search} style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
				<input
					type="text" required minLength={2} value={query} onChange={(e) => setQuery(e.target.value)}
					placeholder="플랫폼 이름 또는 ID (영문 대문자+숫자 6자리)" style={{ ...inputStyle, flex: 1, minWidth: "220px" }}
				/>
				<button type="submit" style={buttonStyle}>검색</button>
			</form>
			{searchError && <div style={{ color: "var(--red)", fontSize: "13px", marginBottom: "12px" }}>{searchError}</div>}

			{results && (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
					{results.length === 0 && (
						<div style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>검색 결과가 없습니다</div>
					)}
					{results.map((p) => (
						<div key={p.id} style={cardStyle}>
							<div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
								<div style={{ flex: 1, minWidth: "180px" }}>
									<div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
									<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
										ID {p.code} · {businessTypeLabel(p.businessType)}{p.address ? ` · ${p.address}` : ""}
									</div>
									{p.description && <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>{p.description}</div>}
								</div>
								<button style={buttonStyle} onClick={() => { setApplyingId(applyingId === p.id ? null : p.id); setMessage(""); }}>
									가입 신청
								</button>
							</div>
							{applyingId === p.id && (
								<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
									<textarea
										rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)}
										placeholder="센터에 전할 말 (선택) — 듣고 싶은 프로그램, 문의 사항 등" style={{ ...inputStyle, resize: "vertical" }}
									/>
									<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
										<button type="button" style={ghostButtonStyle} onClick={() => setApplyingId(null)}>닫기</button>
										<button type="button" style={buttonStyle} disabled={busy} onClick={() => apply(p)}>{busy ? "보내는 중..." : "신청 보내기"}</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			<div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>내 신청 내역</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
				{mine.length === 0 && (
					<div style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>아직 신청한 플랫폼이 없습니다</div>
				)}
				{mine.map((r) => (
					<div key={r.id} style={{ ...cardStyle, flexDirection: "row", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
						<div style={{ flex: 1, minWidth: "180px" }}>
							<div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{r.platformName}</div>
							<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{formatDateTime(r.createdAt)} 신청</div>
							{r.message && <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>내 메모: {r.message}</div>}
							{r.decisionMemo && <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "2px" }}>센터 메모: {r.decisionMemo}</div>}
							{r.status === "APPROVED" && (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>센터에서 프로그램/수강권을 등록하면 이 플랫폼이 내 플랫폼 목록에 나타납니다.</div>
							)}
						</div>
						<span style={{ fontSize: "12px", fontWeight: 600, color: STATUS[r.status]?.color }}>{STATUS[r.status]?.label || r.status}</span>
						{r.status === "PENDING" && <button style={ghostButtonStyle} onClick={() => cancel(r)}>신청 취소</button>}
					</div>
				))}
			</div>
		</div>
	);
}
