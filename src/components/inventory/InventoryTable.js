import { useState } from "react";
import AddItemModal from "./AddItemModal";

/* TABLE STYLES */
const th = {
	padding: "10px",
	border: "1px solid #e0e0e0",
	fontWeight: "600",
	fontSize: "12px",
	textAlign: "center",
	background: "#f5f7fa"
};

const td = {
	padding: "8px",
	border: "1px solid #e0e0e0",
	fontSize: "12px",
	textAlign: "center"
};

/* BUTTON STYLES */
const btn = {
	padding: "7px 12px",
	borderRadius: "6px",
	border: "1px solid #dadce0",
	background: "#f1f3f4",
	cursor: "pointer",
	fontSize: "12px"
};

const primaryBtn = {
	background: "#0d47a1",
	color: "white",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: "pointer"
};

const warnBtn = (disabled) => ({
	background: disabled ? "#ccc" : "#fbbc04",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: disabled ? "not-allowed" : "pointer"
});

const dangerBtn = (disabled) => ({
	background: disabled ? "#ccc" : "#d93025",
	color: "white",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: disabled ? "not-allowed" : "pointer"
});

export default function InventoryTable({ items = [], setItems }) {
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [search, setSearch] = useState("");

	/* CREATE / UPDATE */
	const saveItem = (data) => {
		const updated = editingItem
			? items.map(i =>
				i.id === editingItem.id ? { ...i, ...data } : i
			)
			: [...items, { ...data, id: Date.now() }];

		setItems(updated);
		localStorage.setItem("inventory", JSON.stringify(updated));

		setShowModal(false);
		setEditingItem(null);
	};

	/* DELETE */
	const deleteItem = () => {
		if (!selectedItem) return;
		if (!window.confirm("Delete selected item?")) return;

		const updated = items.filter(i => i.id !== selectedItem.id);
		setItems(updated);
		localStorage.setItem("inventory", JSON.stringify(updated));
		setSelectedItem(null);
	};

	/* SEARCH FILTER */
	const filteredItems = items.filter(i =>
		i.tools?.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div style={{ width: "100%" }}>
			{/* 🔹 TOP BAR */}
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: "12px"
			}}>
				{/* SEARCH */}
				<input
					type="text"
					placeholder="Search tools..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						padding: "8px",
						width: "260px",
						borderRadius: "6px",
						border: "1px solid #dadce0"
					}}
				/>

				{/* CRUD */}
				<div style={{ display: "flex", gap: "8px" }}>
					<button
						onClick={() => { setEditingItem(null); setShowModal(true); }}
						style={primaryBtn}
					>
						+ Create
					</button>

					<button
						disabled={!selectedItem}
						onClick={() => { setEditingItem(selectedItem); setShowModal(true); }}
						style={warnBtn(!selectedItem)}
					>
						Update
					</button>

					<button
						disabled={!selectedItem}
						onClick={deleteItem}
						style={dangerBtn(!selectedItem)}
					>
						Delete
					</button>
				</div>
			</div>

			{/* 🔹 TABLE */}
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						{[
							"No","Tools","Particular","Date","Qty","Borrowed","Add Qty","Life Span",
							"Replaced","Total","Missing","Breakage","Defective",
							"Total Loss","End","CHED","TESDA","DEPED"
						].map(h => <th key={h} style={th}>{h}</th>)}
					</tr>
				</thead>
				<tbody>
					{filteredItems.length === 0 ? (
						<tr>
							<td colSpan="17" style={{ padding: "15px", textAlign: "center" }}>
								No items found
							</td>
						</tr>
					) : (
						filteredItems.map((item, i) => (
							<tr
								key={item.id}
								onClick={() => setSelectedItem(item)}
								style={{
									cursor: "pointer",
									background:
										selectedItem?.id === item.id ? "#e8f0fe" : "transparent"
								}}
							>
								<td style={td}>{i + 1}</td>
								<td style={td}>{item.tools}</td>
								<td style={td}>{item.particular}</td>
								<td style={td}>{item.purchaseDate}</td>
								<td style={td}>{item.qty}</td>
								<td style={td}>{item.borrowed || 0}</td>
								<td style={td}>{item.additionalQty}</td>
								<td style={td}>{item.lifeSpan}</td>
								<td style={td}>{item.replaced}</td>
								<td style={td}>{item.totalInventory}</td>
								<td style={td}>{item.missing}</td>
								<td style={td}>{item.breakage}</td>
								<td style={td}>{item.defective}</td>
								<td style={td}>{item.totalLoss}</td>
								<td style={td}>{item.endInventory}</td>
								<td style={td}>{item.ched}</td>
								<td style={td}>{item.tesda}</td>
								<td style={td}>{item.deped}</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{/* 🔹 BOTTOM RIGHT BUTTONS */}
			<div style={{
				display: "flex",
				justifyContent: "flex-end",
				marginTop: "12px",
				gap: "6px"
			}}>
				<button style={btn}>PDF</button>
				<button style={btn}>CSV</button>
				<button style={btn}>Import CSV</button>
			</div>

			{/* 🔹 MODAL */}
			{showModal && (
				<AddItemModal
					onSave={saveItem}
					onClose={() => { setShowModal(false); setEditingItem(null); }}
					item={editingItem}
				/>
			)}
		</div>
	);
}
