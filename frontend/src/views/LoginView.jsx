import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, setSession } from "../api/http.js";

const ROLE_HOME = {
	OWNER: "/owner",
	MANAGER: "/manager",
	ADMIN: "/tutor",
	USER: "/user"
};

export default function LoginView() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const result = await apiPost("/api/v1/auth/login", { email, password });
			setSession(result);
			navigate(ROLE_HOME[result.user.role] || "/");
		} catch (err) {
			setError(err.message || "로그인에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
			<form
				onSubmit={handleSubmit}
				style={{ width: "min(360px, 90vw)", display: "flex", flexDirection: "column", gap: "14px" }}
			>
				<h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>ReserveHub 로그인</h1>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
					<label style={{ fontSize: "12px", color: "#666" }}>이메일</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{ padding: "10px 12px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "14px" }}
					/>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
					<label style={{ fontSize: "12px", color: "#666" }}>비밀번호</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{ padding: "10px 12px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "14px" }}
					/>
				</div>
				{error && <div style={{ color: "#e11d48", fontSize: "13px" }}>{error}</div>}
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: "11px",
						border: "none",
						borderRadius: "8px",
						background: "#7c6af7",
						color: "white",
						fontWeight: 600,
						fontSize: "14px",
						cursor: loading ? "default" : "pointer",
						opacity: loading ? 0.7 : 1
					}}
				>
					{loading ? "로그인 중..." : "로그인"}
				</button>
			</form>
		</div>
	);
}
