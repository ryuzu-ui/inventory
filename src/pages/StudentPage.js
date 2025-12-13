import React, { useState } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import { generateBorrowDoc } from "../components/services/docxGenerator";

export default function StudentPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const [products] = useState([]); // from inventory later
	const [selectedItems, setSelectedItems] = useState([]);
	const [studentInfo, setStudentInfo] = useState({
		name: "",
		labNo: "",
		controlNo: ""
	});

	const handleSelect = (id, qty, description) => {
		setSelectedItems((prev) => {
			const exists = prev.find((i) => i.id === id);
			if (exists) return prev.map((i) => (i.id === id ? { ...i, qty } : i));
			return [...prev, { id, qty, description }];
		});
	};

	return (
		<div style={{ background: "#fff", minHeight: "100vh" }}>
			<StudentHeader onMenuClick={() => setSidebarOpen(true)} />
			<StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div style={{ padding: "20px", paddingTop: "60px" }}>
				<h2>Borrow Form</h2>

				

				{/* TABLE OF ITEMS ONLY */}
				<BorrowTable
					products={products}
					onSelect={handleSelect}
					selectedItems={selectedItems}
				/>

				{/* EXPORT BUTTON */}
				<button
					style={{
						marginTop: "20px",
						background: "#0d47a1",
						color: "white",
						border: "none",
						padding: "10px 18px",
						borderRadius: "6px",
						cursor: "pointer"
					}}
					onClick={() =>
						generateBorrowDoc(studentInfo, selectedItems, products)
					}
				>
					Generate Borrow Form
				</button>
			</div>
		</div>
	);
}
