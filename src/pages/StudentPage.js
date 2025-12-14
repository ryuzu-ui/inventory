import { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import StudentCalendar from "../components/student/StudentCalendar";

export default function StudentPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [page, setPage] = useState("borrow");

	useEffect(() => {
		document.title = "Student | Inventory System";
	}, []);

	return (
		<div style={{ minHeight: "100vh", background: "#111" }}>
			{/* HEADER */}
			<StudentHeader onMenuClick={() => setSidebarOpen(true)} />

			{/* SIDEBAR */}
			<StudentSidebar
				open={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onNavigate={(p) => {
					setPage(p);
					setSidebarOpen(false);
				}}
			/>

			{/* CONTENT */}
			<div style={{ padding: "20px"}}>
				{page === "borrow" && (
					<>
						<h2 style={{ color: "white" }}>Borrow Form</h2>
						<BorrowTable />
					</>
				)}

				{page === "calendar" && (
					<>
						<h2 style={{ color: "white" }}>No-Pass Calendar</h2>
						<StudentCalendar />
					</>
				)}

				{page === "home" && (
					<h2 style={{ color: "white" }}>Welcome Student 👋</h2>
				)}
			</div>
		</div>
	);
}
