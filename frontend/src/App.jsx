import { Routes, Route } from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import LoginView from "./views/LoginView.jsx";
import UserView from "./views/user/UserView.jsx";
import TutorView from "./views/tutor/TutorView.jsx";
import ManagerView from "./views/manager/ManagerView.jsx";
import OwnerView from "./views/owner/OwnerView.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

export default function App() {
	return (
		<>
			<nav></nav>
			<Routes>
				<Route path="/" element={<TestHomeView />} />
				<Route path="/login" element={<LoginView />} />
				<Route path="/user" element={<UserView />} />
				<Route path="/tutor" element={<TutorView />} />
				<Route path="/manager" element={<ManagerView />} />
				<Route path="/owner" element={<OwnerView />} />
				{/*<Route path="/user" element={<RequireAuth roles={["USER"]}><UserView /></RequireAuth>} />*/}
				{/*<Route path="/tutor" element={<RequireAuth roles={["ADMIN"]}><TutorView /></RequireAuth>} />*/}
				{/*<Route path="/manager" element={<RequireAuth roles={["MANAGER"]}><ManagerView /></RequireAuth>} />*/}
				{/*<Route path="/owner" element={<RequireAuth roles={["OWNER"]}><OwnerView /></RequireAuth>} />*/}
			</Routes>
		</>
	);
}
