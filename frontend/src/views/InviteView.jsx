import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiPost, setSession, clearSession, loadCurrentUser, getCurrentUser } from "../api/http.js";
import { acceptStaffInvitation, previewStaffInvitation } from "../api/common.js";

const ROLE_LABEL = { MANAGER: "매니저", TUTOR: "강사" };

const inputStyle = {
	padding: "10px 12px",
	background: "var(--surface2)",
	border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)",
	color: "var(--text)",
	fontSize: "14px",
	outline: "none"
};
const buttonStyle = {
	padding: "11px",
	border: "none",
	borderRadius: "var(--radius-sm)",
	background: "var(--cta)",
	color: "white",
	fontWeight: 600,
	fontSize: "14px",
	cursor: "pointer"
};

// 초대 링크(/invite/:token)로 들어오는 화면 — 로그인(또는 가입)한 계정의 이메일/연락처가 초대에 적힌 값과
// 일치하면 자동으로 수락(승인)되어 플랫폼의 강사/매니저로 배정된다. 일치 검증은 서버가 한다.
export default function InviteView() {
	const { token } = useParams();
	const navigate = useNavigate();
	const [invite, setInvite] = useState(null);
	const [user, setUser] = useState(null);
	const [mode, setMode] = useState("login");
	const [form, setForm] = useState({ username: "", password: "", email: "", name: "", phone: "" });
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [rejected, setRejected] = useState(false); // 자동 승인이 거절된 계정 — 다른 계정으로 다시 시도하게 한다
	const attempted = useRef(null); // 같은 계정으로 자동 수락을 두 번 시도하지 않도록 계정 id를 기억

	useEffect(() => {
		previewStaffInvitation(token).then((p) => {
			setInvite(p);
			setForm((f) => ({ ...f, email: p.email || "", phone: p.phone || "" }));
		}).catch((err) => setError(err.message || "유효하지 않은 초대 링크입니다."));
		loadCurrentUser().then(setUser);
	}, [token]);

	const usable = invite && invite.status === "PENDING" && !invite.expired;
	const me = user || getCurrentUser();

	// 링크가 유효하고 로그인된 상태면 바로 비교·승인한다. 불일치면 서버 사유를 보여주고 계정 전환을 안내한다.
	useEffect(() => {
		if (!usable || !me?.id || attempted.current === me.id) return;
		attempted.current = me.id;
		setBusy(true);
		setError("");
		acceptStaffInvitation(token)
			.then(() => navigate("/app"))
			.catch((err) => {
				setRejected(true);
				setError(err.message || "초대 승인에 실패했습니다.");
			})
			.finally(() => setBusy(false));
	}, [usable, me?.id, token, navigate]);

	const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

	async function submitAuth(e) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			// 가입 시 이메일/연락처는 초대받은 값으로 고정해서 보낸다 — 다른 값으로는 승인되지 않는다.
			const result = mode === "login"
				? await apiPost("/api/v1/auth/login", { username: form.username, password: form.password })
				: await apiPost("/api/v1/auth/register", { ...form, role: "USER" });
			setSession(result.accessToken);
			setUser(await loadCurrentUser());
		} catch (err) {
			setError(err.message || "인증에 실패했습니다.");
		} finally {
			setBusy(false);
		}
	}

	function switchAccount() {
		clearSession();
		setUser(null);
		setRejected(false);
		setError("");
	}

	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
			<div style={{ width: "min(380px, 90vw)", display: "flex", flexDirection: "column", gap: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px" }}>
				<div style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase" }}>ReserveHub</div>
				{!invite ? (
					<div style={{ color: error ? "var(--red)" : "var(--text-sub)", fontSize: "14px" }}>{error || "초대 정보를 불러오는 중..."}</div>
				) : (
					<>
						<h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
							{invite.platformName}의 {ROLE_LABEL[invite.staffRole]} 초대
						</h1>
						{!usable ? (
							<div style={{ color: "var(--red)", fontSize: "13px" }}>
								{invite.status === "ACCEPTED" ? "이미 수락된 초대입니다." : invite.status === "CANCELLED" ? "취소된 초대입니다." : "만료된 초대입니다. 초대한 분께 다시 요청하세요."}
							</div>
						) : me?.id ? (
							rejected ? (
								<>
									<div style={{ fontSize: "13px", color: "var(--text-sub)" }}>
										<b>{me.name || me.username}</b> 계정으로는 승인할 수 없습니다.
									</div>
									<button style={buttonStyle} onClick={switchAccount}>다른 계정으로 로그인</button>
								</>
							) : (
								<div style={{ fontSize: "13px", color: "var(--text-sub)" }}>
									<b>{me.name || me.username}</b> 계정의 이메일/연락처를 초대 정보와 확인하는 중...
								</div>
							)
						) : (
							<form onSubmit={submitAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
								<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
									초대받은 이메일/연락처와 같은 정보를 가진 계정으로 로그인하면 자동으로 승인됩니다.
								</div>
								<div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
									<button type="button" onClick={() => setMode("login")} style={{ ...inputStyle, flex: 1, fontWeight: mode === "login" ? 700 : 400 }}>로그인</button>
									<button type="button" onClick={() => setMode("register")} style={{ ...inputStyle, flex: 1, fontWeight: mode === "register" ? 700 : 400 }}>가입</button>
								</div>
								<input placeholder="아이디" required value={form.username} onChange={set("username")} style={inputStyle} />
								<input type="password" placeholder="비밀번호" required value={form.password} onChange={set("password")} style={inputStyle} />
								{mode === "register" && (
									<>
										<input type="email" placeholder="이메일" required readOnly={!!invite.email} value={form.email} onChange={set("email")} style={inputStyle} />
										<input placeholder="이름" required value={form.name} onChange={set("name")} style={inputStyle} />
										<input placeholder="연락처" readOnly={!!invite.phone} value={form.phone} onChange={set("phone")} style={inputStyle} />
									</>
								)}
								<button type="submit" style={buttonStyle} disabled={busy}>{busy ? "처리 중..." : mode === "login" ? "로그인" : "가입하고 계속"}</button>
							</form>
						)}
						{error && <div style={{ color: "var(--red)", fontSize: "13px" }}>{error}</div>}
					</>
				)}
			</div>
		</div>
	);
}
