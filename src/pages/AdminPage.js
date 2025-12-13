import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";
import Dashboard from "../components/admin/Dashboard"; // <-- make sure meron ka nito

export default function AdminPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [page, setPage] = useState("dashboard"); // <-- NEW

	const [items, setItems] = useState(() => {
		const saved = localStorage.getItem("inventory");
		return saved ? JSON.parse(saved) : [];
	});

	useEffect(() => {

		document.title = "Admin | Inventory System";
		
		const saved = localStorage.getItem("inventory");
		
		if (saved) {
			setItems(JSON.parse(saved));
		}
	}, []);

	return (
		<div style={{ height: "100vh", background: "white" }}>
			<Header onMenuClick={() => setSidebarOpen(true)} />

			<Sidebar
				open={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onNavigate={setPage}   // <-- IMPORTANT
			/>

			<div style={{ padding: "20px" }}>
				{page === "dashboard" && <Dashboard />}
				{page === "inventory" && (
					<InventoryTable items={items} setItems={setItems} />
				)}
			</div>
		</div>
	);
}
