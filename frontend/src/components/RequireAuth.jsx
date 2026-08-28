import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/http.js";

// 세션 id는 HttpOnly 쿠키에 있어 JS로는 존재 여부를 알 수 없다 — 실제 로그인 판정은 AppShell
// 마운트 시 loadCurrentUser()(GET /api/v1/auth/me)가 담당하고, 여기서는 그 결과로 채워진
// 메모리 캐시만 확인한다.
export default function RequireAuth({ roles, children }) {
	const user = getCurrentUser();

	if (!user) return <Navigate to="/login" replace />;
	if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

	return children;
}
