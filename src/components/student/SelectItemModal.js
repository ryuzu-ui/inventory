import { useState } from "react";

export default function SelectItemModal({
	open,
	onClose,
	inventory,
	selectedItems,
	setSelectedItems
}) {
	const [search, setSearch] = useState("");

	if (!open) return null;

	const toggleItem = (item) => {
		if (selectedItems.some((i) => i.id === item.id)) {
			setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
		} else {
			setSelectedItems([...selectedItems, { ...item, qty: 1 }]);
		}
	};

	// 🔍 FILTER INVENTORY BY SEARCH
	const filteredInventory = inventory.filter((item) =>
		item.name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div style={overlay}>
			<div style={modal}>
				<h3 style={{ marginBottom: "10px" }}>Select Items</h3>

				{/* 🔍 SEARCH INPUT */}
				<input
					type="text"
					placeholder="Search tool..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						width: "100%",
						padding: "8px",
						marginBottom: "12px",
						borderRadius: "4px",
						border: "1px solid #444",
						background: "#111",
						color: "white"
					}}
				/>

				{/* ITEM LIST */}
				<div style={{ maxHeight: "220px", overflowY: "auto" }}>
					{filteredInventory.length === 0 && (
						<div style={{ opacity: 0.6 }}>No items found</div>
					)}

					{filteredInventory.map((item) => (
						<label
							key={item.id}
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: "8px",
								cursor: "pointer"
							}}
						>
							<input
								type="checkbox"
								checked={selectedItems.some((i) => i.id === item.id)}
								onChange={() => toggleItem(item)}
								style={{ marginRight: "8px" }}
							/>
							{item.name}
						</label>
					))}
				</div>

				{/* ACTION */}
				<div style={{ textAlign: "right", marginTop: "15px" }}>
					<button onClick={onClose}>Done</button>
				</div>
			</div>
		</div>
	);
}

/* ===== STYLES ===== */

const overlay = {
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.6)",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	zIndex: 1000
};

const modal = {
	width: "300px",
	background: "#1a1a1a",
	color: "white",
	padding: "20px",
	borderRadius: "8px"
};
