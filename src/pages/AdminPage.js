import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";

export default function AdminPage() {
	return (
		<div style={{ height: "100vh", background: "white", display: "flex", flexDirection: "column" }}>
			<Header />

			<div style={{ display: "flex", flex: 1 }}>
				<Sidebar />

				<div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
					<InventoryTable />
				</div>
			</div>
		</div>
	);
}
