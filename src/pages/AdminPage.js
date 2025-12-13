import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";

export default function AdminPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [items, setItems] = useState(() => {
		const saved = localStorage.getItem("inventory");
		return saved ? JSON.parse(saved) : [];
	});

	useEffect(() => {
		const saved = localStorage.getItem("inventory");
		if (saved) {
			setItems(JSON.parse(saved));
		}
	}, []);


	return (
		<div style={{ height: "100vh", background: "white" }}>
			<Header onMenuClick={() => setSidebarOpen(true)} />
			<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div style={{ padding: "20px" }}>
				<InventoryTable items={items} setItems={setItems} />
			</div>
		</div>
	);
}
