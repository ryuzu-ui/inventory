import { useState } from "react";

const TEMP_ITEMS = [
	{ id: 1, description: "Hammer", available: 10 },
	{ id: 2, description: "Screwdriver Set", available: 15 },
	{ id: 3, description: "Multimeter", available: 5 },
	{ id: 4, description: "Power Drill", available: 3 }
];

export default function SelectItemModal({ onClose, onSave }) {
	const [selected, setSelected] = useState([]);

	const toggleItem = (item) => {
		if (selected.find((i) => i.id === item.id)) {
			setSelected(selected.filter((i) => i.id !== item.id));
		} else {
			setSelected([
				...selected,
				{
					id: item.id,
					description: item.description,
					qty: 1
				}
			]);
		}
	};

	const updateQty = (id, qty) => {
		setSelected(selected.map((i) => (i.id === id ? { ...i, qty } : i)));
	};

	return (
		<>
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100vw",
					height: "100vh",
					background: "rgba(0,0,0,0.35)",
					zIndex: 20
				}}
				onClick={onClose}
			/>

			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					background: "white",
					padding: "20px",
					borderRadius: "10px",
					width: "500px",
					zIndex: 21
				}}
			>
				<b style={{ fontSize: "16px" }}>Select Items</b>

				<table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
					<thead>
						<tr>
							<th></th>
							<th>Description</th>
							<th>Available</th>
							<th>Qty</th>
						</tr>
					</thead>
					<tbody>
						{TEMP_ITEMS.map((item) => (
							<tr key={item.id}>
								<td>
									<input
										type="checkbox"
										checked={!!selected.find((i) => i.id === item.id)}
										onChange={() => toggleItem(item)}
									/>
								</td>
								<td>{item.description}</td>
								<td>{item.available}</td>
								<td>
									<input
										type="number"
										value={selected.find((i) => i.id === item.id)?.qty || 1}
										onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
										style={{ width: "50px" }}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<div style={{ textAlign: "right", marginTop: "15px" }}>
					<button
						onClick={onClose}
						style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", background: "#eee", marginRight: "6px" }}
					>
						Cancel
					</button>
					<button
						onClick={() => onSave(selected)}
						style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#1a73e8", color: "white" }}
					>
						Add Selected
					</button>
				</div>
			</div>
		</>
	);
}
