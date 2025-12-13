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

	const handleSelect = (id, qty) => {
		setSelectedItems((prev) => {
			const exists = prev.find((i) => i.id === id);
			if (exists)
				return prev.map((i) => (i.id === id ? { ...i, qty } : i));
			return [...prev, { id, qty }];
		});
	};

	return (
		<div style={{ background: "#fff", minHeight: "100vh" }}>
			<StudentHeader onMenuClick={() => setSidebarOpen(true)} />
			<StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{/* CONTENT */}
			<div style={{ padding: "20px", paddingTop: "80px" }}>
				<h2>Borrow Form</h2>

				{/* TOP INFO */}
				<div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
					<input
						type="text"
						placeholder="Student Name"
						value={studentInfo.name}
						onChange={(e) =>
							setStudentInfo({ ...studentInfo, name: e.target.value })
						}
					/>
					<input
						type="text"
						placeholder="Laboratory No"
						value={studentInfo.labNo}
						onChange={(e) =>
							setStudentInfo({ ...studentInfo, labNo: e.target.value })
						}
					/>
					<input
						type="text"
						placeholder="Control No"
						value={studentInfo.controlNo}
						onChange={(e) =>
							setStudentInfo({ ...studentInfo, controlNo: e.target.value })
						}
					/>
				</div>

				<BorrowTable products={products} onSelect={handleSelect} />

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
