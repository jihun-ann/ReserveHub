import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost, setSession, loadCurrentUser } from "../api/http.js";

const inputStyle = {
	padding: "10px 12px",
	background: "var(--surface2)",
	border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)",
	color: "var(--text)",
	fontSize: "14px",
	outline: "none"
};

const FIELDS = [
	{ key: "username", label: "아이디", type: "text", hint: "영문/숫자/밑줄 4~20자", pattern: "[a-zA-Z0-9_]{4,20}" },
	{ key: "password", label: "비밀번호", type: "password" },
	{ key: "passwordConfirm", label: "비밀번호 확인", type: "password" },
	{ key: "name", label: "이름", type: "text" },
	{ key: "email", label: "이메일", type: "email" },
	{ key: "phone", label: "연락처 (선택)", type: "tel", optional: true }
];

export default function RegisterView() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ username: "", password: "", passwordConfirm: "", name: "", email: "", phone: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		if (form.password !== form.passwordConfirm) {
			setError("비밀번호가 일치하지 않습니다.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			// 일반 회원가입은 항상 USER 역할 — 매니저/강사는 초대 링크로만 합류한다.
			const result = await apiPost("/api/v1/auth/register", { ...form, passwordConfirm: undefined, role: "USER" });
			setSession(result.accessToken);
			await loadCurrentUser();
			navigate("/app");
		} catch (err) {
			setError(err.message || "회원가입에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
			<form
				onSubmit={handleSubmit}
				style={{
					width: "min(360px, 90vw)",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: "var(--radius)",
					padding: "28px"
				}}
			>
				<div>
					<div style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>ReserveHub</div>
					<h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>회원가입</h1>
				</div>
				{FIELDS.map((f) => (
					<div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<label style={{ fontSize: "12px", color: "var(--text-sub)" }}>{f.label}</label>
						<input
							type={f.type}
							value={form[f.key]}
							onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
							required={!f.optional}
							pattern={f.pattern}
							title={f.hint}
							placeholder={f.hint}
							style={inputStyle}
						/>
					</div>
				))}
				{error && <div style={{ color: "var(--red)", fontSize: "13px" }}>{error}</div>}
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: "11px",
						border: "none",
						borderRadius: "var(--radius-sm)",
						background: "var(--cta)",
						color: "white",
						fontWeight: 600,
						fontSize: "14px",
						fontFamily: "'Pretendard', sans-serif",
						cursor: loading ? "default" : "pointer",
						boxShadow: "0 3px 10px rgba(245,166,35,.3)",
						opacity: loading ? 0.7 : 1
					}}
				>
					{loading ? "가입 중..." : "가입하기"}
				</button>
				<div style={{ fontSize: "13px", color: "var(--text-sub)", textAlign: "center" }}>
					이미 계정이 있나요? <Link to="/login" style={{ color: "var(--accent)" }}>로그인</Link>
				</div>
			</form>
		</div>
	);
}
