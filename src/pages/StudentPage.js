import { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import StudentCalendar from "../components/student/StudentCalendar";

export default function StudentPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [page, setPage] = useState("home");

	useEffect(() => {
		document.title = "Student | Inventory System";
	}, []);

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "#111",
				color: "white",
			}}
		>
			{/* HEADER (ALWAYS PRESENT) */}
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
			<div
				style={{
					padding: "20px",
					paddingTop: "80px", // space for fixed header
				}}
			>
				{page === "home" && (
					<div
						style={{
							background: "#1e1e1e",
							padding: "25px",
							borderRadius: "12px",
						}}
					>
						<h2>Welcome Student 👋</h2>
						<p>
							Use the sidebar to borrow equipment or check your lab
							schedule.
						</p>
					</div>
				)}

				{page === "borrow" && (
					<>
						<h2>Borrow Form</h2>
						<BorrowTable />
					</>
				)}

				{page === "calendar" && (
					<>
						<h2>No-Pass Calendar</h2>
						<StudentCalendar />
					</>
				)}
			</div>
		</div>
	);
}
