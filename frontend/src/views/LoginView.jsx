import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost, setSession, loadCurrentUser } from "../api/http.js";

export default function LoginView() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const result = await apiPost("/api/v1/auth/login", { username, password });
			setSession(result.accessToken);
			await loadCurrentUser();
			navigate("/app");
		} catch (err) {
			setError(err.message || "로그인에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}

	const inputStyle = {
		padding: "10px 12px",
		background: "var(--surface2)",
		border: "1px solid var(--border)",
		borderRadius: "var(--radius-sm)",
		color: "var(--text)",
		fontSize: "14px",
		outline: "none"
	};

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
					<h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>로그인</h1>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
					<label style={{ fontSize: "12px", color: "var(--text-sub)" }}>아이디</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						style={inputStyle}
					/>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
					<label style={{ fontSize: "12px", color: "var(--text-sub)" }}>비밀번호</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={inputStyle}
					/>
				</div>
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
					{loading ? "로그인 중..." : "로그인"}
				</button>
				<div style={{ fontSize: "13px", color: "var(--text-sub)", textAlign: "center" }}>
					계정이 없나요? <Link to="/register" style={{ color: "var(--accent)" }}>회원가입</Link>
				</div>
			</form>
		</div>
	);
}
