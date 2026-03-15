import { useState } from "react";
import AddItemModal from "./AddItemModal";
import * as XLSX from "xlsx";
import { createItem, updateItem, deleteItem } from "../../helper/api";


/* TABLE STYLES */
const th = {
	padding: "14px",
	border: "1px solid #cfd8e3",
	fontWeight: "600",
	fontSize: "14px",
	textAlign: "center",
	background: "#0d47a1",
	color: "white",
	whiteSpace: "nowrap"
};

const td = {
	padding: "11px",
	border: "1px solid #e0e6ef",
	fontSize: "13.5px",
	textAlign: "center",
	color: "#102a43"
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
	const [selectedIds, setSelectedIds] = useState([]);

	/* CREATE / UPDATE */
	const saveItem = async (data) => {
		try {
			if (editingItem?.id) {
				const updatedRow = await updateItem(editingItem.id, data);
				setItems(items.map(i => (i.id === editingItem.id ? updatedRow : i)));
			} else {
				const created = await createItem(data);
				setItems([created, ...items]);
			}

			setShowModal(false);
			setEditingItem(null);
		} catch (e) {
			console.error("saveItem error:", e);
			alert(e.message || "Failed to save item");
		}
	};

	/* DELETE */
	const deleteSelectedItems = async () => {
		if (selectedIds.length === 0) return;
		if (!window.confirm(`Delete ${selectedIds.length} item(s)?`)) return;

		try {
			for (const id of selectedIds) {
				await deleteItem(id);
			}
			setItems(items.filter(i => !selectedIds.includes(i.id)));
			setSelectedIds([]);
			setSelectedItem(null);
		} catch (e) {
			console.error("deleteItem error:", e);
			alert(e.message || "Failed to delete item(s)");
		}
	};


	const toggleSelect = (id) => {
		setSelectedIds(prev =>
			prev.includes(id)
				? prev.filter(x => x !== id)
				: [...prev, id]
		);
	};

const isSelected = (id) => selectedIds.includes(id);


	/* SEARCH FILTER */
	const filteredItems = items.filter(i => {
		const s = search.toLowerCase();
		return (
			String(i.item_name || "").toLowerCase().includes(s) ||
			String(i.item_code || "").toLowerCase().includes(s) ||
			String(i.category || "").toLowerCase().includes(s)
		);
	});

	const handleImportXLSX = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (evt) => {
			const data = new Uint8Array(evt.target.result);
			const workbook = XLSX.read(data, { type: "array" });

			// Kunin first sheet
			const sheetName = workbook.SheetNames[0];
			const sheet = workbook.Sheets[sheetName];

			// Convert to JSON
			const rows = XLSX.utils.sheet_to_json(sheet);

			const existingCodes = items.map(i =>
				String(i.item_code || "").toLowerCase().trim()
			);


			const importedItems = [];

			rows.forEach(row => {
				const code = String(row.item_code ?? row.code ?? row.itemCode ?? "").trim();
				const name = String(row.item_name ?? row.name ?? row.itemName ?? "").trim();
				if (!code || !name) return;

				if (existingCodes.includes(code.toLowerCase())) {
					return; // skip duplicate
				}

				importedItems.push({
					item_code: code,
					item_name: name,
					category: String(row.category ?? "").trim() || "",
					quantity: Number(row.quantity ?? row.qty ?? 0) || 0,
				});
			});


			if (importedItems.length === 0) {
				alert("No new items imported (duplicates detected).");
				return;
			}

			Promise.all(importedItems.map((it) => createItem(it)))
				.then((createdRows) => {
					setItems([...createdRows, ...items]);
				})
				.catch((e) => {
					console.error("Import createItem error:", e);
					alert(e.message || "Failed to import items");
				});

		};

		reader.readAsArrayBuffer(file);
	};


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
						disabled={selectedIds.length !== 1}
						onClick={() => {
							const item = items.find(i => i.id === selectedIds[0]);
							setEditingItem(item);
							setShowModal(true);
						}}
						style={warnBtn(selectedIds.length !== 1)}
					>
						Update
					</button>


					<button
						disabled={!selectedItem}
						onClick={deleteSelectedItems}
						style={dangerBtn(!selectedItem)}
					>
						Delete
					</button>
				</div>
			</div>

			{/* 🔹 TABLE */}
			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
					background: "white",
					overflow: "hidden",
					boxShadow: "0 6px 18px rgba(13,71,161,0.12)"
				}}
			>
				<thead>
					<tr>
						<th style={th}>Select</th>
						{["No", "Item Code", "Item Name", "Category", "Quantity"].map(h => (
							<th key={h} style={th}>{h}</th>
						))}
					</tr>
				</thead>

				<tbody>
					{filteredItems.length === 0 ? (
						<tr>
							<td colSpan="6" style={{ padding: "15px", textAlign: "center" }}>
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
										selectedItem?.id === item.id
											? "#dbe7f7"          // selected
											: i % 2 === 0
												? "#ffffff"       // white
												: "#eef3fb",      // light blue
									transition: "background 0.2s ease"
								}}
							>
								<td style={td}>
									<input
										type="checkbox"
										checked={selectedIds.includes(item.id)}
										onChange={() => toggleSelect(item.id)}
										style={{
											transform: "scale(1.1)",
											accentColor: "#0d47a1"
										}}
									/>
								</td>

								<td style={td}>{i + 1}</td>
								<td style={td}>{item.item_code}</td>
								<td style={td}>{item.item_name}</td>
								<td style={td}>{item.category}</td>
								<td style={td}>{item.quantity}</td>
								
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
				<label style={btn}>
					Import Excel
					<input
						type="file"
						accept=".xlsx"
						onChange={handleImportXLSX}
						style={{ display: "none" }}
					/>
				</label>

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
