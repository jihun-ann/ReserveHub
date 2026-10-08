import { Routes, Route, Navigate } from "react-router-dom";
import LoginView from "./views/LoginView.jsx";
import AppShell from "./views/AppShell.jsx";
import InviteView from "./views/InviteView.jsx";
import RegisterView from "./views/RegisterView.jsx";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<LoginView />} />
				<Route path="/register" element={<RegisterView />} />
			<Route path="/invite/:token" element={<InviteView />} />
			<Route path="/app" element={<AppShell />} />
		</Routes>
	);
}
