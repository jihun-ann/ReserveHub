import { Routes, Route, Navigate } from "react-router-dom";
import LoginView from "./views/LoginView.jsx";
import AppShell from "./views/AppShell.jsx";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<LoginView />} />
			<Route path="/app" element={<AppShell />} />
		</Routes>
	);
}
