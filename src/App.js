import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import StudentPage from "./pages/StudentPage";

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<StudentPage />} />
				<Route path="/admin" element={<AdminPage />} />
			</Routes>
		</Router>
	);
}
