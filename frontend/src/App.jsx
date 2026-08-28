import { Routes, Route } from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import LoginView from "./views/LoginView.jsx";
import AppShell from "./views/AppShell.jsx";

export default function App() {
	return (
		<>
			<nav></nav>
			<Routes>
				<Route path="/" element={<TestHomeView />} />
				<Route path="/login" element={<LoginView />} />
				<Route path="/app" element={<AppShell />} />
			</Routes>
		</>
	);
}
