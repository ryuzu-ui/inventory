import { useEffect, useState } from "react";

export default function SelectItemModal({ onClose, onSave }) {
	const [inventory, setInventory] = useState([]);
	const [selected, setSelected] = useState([]);

	// 🔹 LOAD INVENTORY FROM ADMIN (localStorage)
	useEffect(() => {
		const saved = localStorage.getItem("inventory");
		if (saved) {
			setInventory(JSON.parse(saved));
		}
	}, []);

	const toggleItem = (item) => {
		const exists = selected.find((i) => i.id === item.id);

		if (exists) {
			setSelected(selected.filter((i) => i.id !== item.id));
		} else {
			setSelected([
				...selected,
				{
					id: item.id,
					tools: item.tools,
					qty: 1
				}
			]);
		}
	};

	const updateQty = (id, qty) => {
		setSelected(
			selected.map((i) =>
				i.id === id ? { ...i, qty } : i
			)
		);
	};

	return (
		<>
			{/* BACKDROP */}
			<div
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.35)",
					zIndex: 20
				}}
				onClick={onClose}
			/>

			{/* MODAL */}
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					background: "white",
					padding: "20px",
					borderRadius: "10px",
					width: "520px",
					zIndex: 21
				}}
			>
				<b style={{ fontSize: "16px" }}>Select Items</b>

				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						marginTop: "10px"
					}}
				>
					<thead>
						<tr>
							<th></th>
							<th>Description</th>
							<th>Available</th>
							<th>Qty</th>
						</tr>
					</thead>

					<tbody>
						{inventory.length === 0 ? (
							<tr>
								<td colSpan="4" style={{ textAlign: "center", padding: "15px" }}>
									No inventory available
								</td>
							</tr>
						) : (
							inventory.map((item) => (
								<tr key={item.id}>
									<td>
										<input
											type="checkbox"
											checked={!!selected.find((i) => i.id === item.id)}
											onChange={() => toggleItem(item)}
										/>
									</td>

									<td>{item.tools}</td>
									<td>{item.qty}</td>

									<td>
										<input
											type="number"
											min="1"
											value={
												selected.find((i) => i.id === item.id)?.qty || 1
											}
											onChange={(e) =>
												updateQty(item.id, Number(e.target.value))
											}
											style={{ width: "55px" }}
										/>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				<div style={{ textAlign: "right", marginTop: "15px" }}>
					<button
						onClick={onClose}
						style={{
							padding: "6px 12px",
							borderRadius: "6px",
							border: "1px solid #ccc",
							background: "#eee",
							marginRight: "6px"
						}}
					>
						Cancel
					</button>

					<button
						onClick={() => onSave(selected)}
						style={{
							padding: "6px 12px",
							borderRadius: "6px",
							border: "none",
							background: "#1a73e8",
							color: "white"
						}}
					>
						Add Selected
					</button>
				</div>
			</div>
		</>
	);
}
