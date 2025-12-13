import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";

export default function AdminPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// ✅ INVENTORY STATE IS HERE
	const [items, setItems] = useState([]); // admin will add items

	return (
		<div style={{ height: "100vh", background: "white" }}>
			<Header onMenuClick={() => setSidebarOpen(true)} />
			<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div
				style={{
					padding: "20px",
					paddingTop: "20px"
				}}
			>
				{/* ✅ PASS items + setItems */}
				<InventoryTable items={items} setItems={setItems} />
			</div>
		</div>
	);
}
