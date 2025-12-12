import { useState } from "react";
import AddEditItemModal from "./AddEditItemModal";

export default function InventoryTable() {
	const [items, setItems] = useState([
		{ id: 1, name: "Tripod", qty: 10 },
		{ id: 2, name: "Uniform", qty: 5 },
	]);

	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);

	const handleSave = (item) => {
		if (editItem) {
			setItems(items.map(i => i.id === item.id ? item : i));
		} else {
			setItems([...items, { ...item, id: Date.now() }]);
		}
		setModalOpen(false);
		setEditItem(null);
	};

	const handleDelete = (id) => {
		if (!window.confirm("Delete this item?")) return;
		setItems(items.filter(i => i.id !== id));
	};

	return (
		<div id="inventory">
			<h1 style={{ color: "#1a73e8" }}>Inventory</h1>

			<button
				style={{
					background: "#fff9c4",
					padding: "10px 20px",
					border: "1px solid #1a73e8",
					color: "#1a73e8",
					borderRadius: "6px",
					cursor: "pointer",
					marginBottom: "15px"
				}}
				onClick={() => setModalOpen(true)}
			>
				➕ Add Item
			</button>

			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
					background: "white"
				}}
			>
				<thead>
					<tr style={{ background: "#fff9c4" }}>
						<th>ID</th>
						<th>Description</th>
						<th>Quantity</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					{items.map((item) => (
						<tr key={item.id}>
							<td>{item.id}</td>
							<td>{item.name}</td>
							<td>{item.qty}</td>
							<td>
								<button
									style={{
										background: "#1a73e8",
										color: "white",
										border: "none",
										padding: "6px 12px",
										borderRadius: "6px",
										marginRight: "8px",
										cursor: "pointer"
									}}
									onClick={() => { setEditItem(item); setModalOpen(true); }}
								>
									Edit
								</button>

								<button
									style={{
										background: "#e53935",
										color: "white",
										border: "none",
										padding: "6px 12px",
										borderRadius: "6px",
										cursor: "pointer"
									}}
									onClick={() => handleDelete(item.id)}
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{modalOpen &&
				<AddEditItemModal
					close={() => { setModalOpen(false); setEditItem(null); }}
					save={handleSave}
					item={editItem}
				/>
			}
		</div>
	);
}
