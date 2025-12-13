import React, { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";

export default function StudentPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [inventory, setInventory] = useState([]);

	// ✅ LOAD INVENTORY FROM ADMIN
	useEffect(() => {
		document.title = "Student | Inventory System";
		const saved = localStorage.getItem("inventory");
		if (saved) {
			setInventory(JSON.parse(saved));
		}
	}, []);

	return (
		<div style={{ background: "#fff", minHeight: "100vh" }}>
			<StudentHeader onMenuClick={() => setSidebarOpen(true)} />
			<StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div style={{ padding: "20px", paddingTop: "60px" }}>
				<h2>Borrow Form</h2>

				{/* ✅ PASS INVENTORY TO BORROW TABLE */}
				<BorrowTable inventory={inventory} />
			</div>
		</div>
	);
}
