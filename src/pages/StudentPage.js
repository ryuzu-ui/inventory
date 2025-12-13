import React, { useState } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";

export default function StudentPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div style={{ background: "#fff", minHeight: "100vh" }}>
			<StudentHeader onMenuClick={() => setSidebarOpen(true)} />
			<StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div style={{ padding: "20px", paddingTop: "60px" }}>
				<h2>Borrow Form</h2>

				<BorrowTable />
			</div>
		</div>
	);
}
