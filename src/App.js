import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages//LoginPage";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";
import { getUser } from "./components/services/authService";

function ProtectedRoute({ children, role }) {
	const user = getUser();

	if (!user || user.role !== role) {
		return <LoginPage />;
	}

	return children;
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LoginPage />} />

				<Route
					path="/student"
					element={
						<ProtectedRoute role="student">
							<StudentPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/admin"
					element={
						<ProtectedRoute role="admin">
							<AdminPage />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}
