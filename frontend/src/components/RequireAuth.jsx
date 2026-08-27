import { Navigate } from "react-router-dom";
import { getAccessToken, getCurrentUser } from "../api/http.js";

export default function RequireAuth({ roles, children }) {
	const token = getAccessToken();
	const user = getCurrentUser();

	if (!token || !user) return <Navigate to="/login" replace />;
	if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

	return children;
}
