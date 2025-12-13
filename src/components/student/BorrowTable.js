import { useEffect, useState } from "react";
import { PrintBorrowPDF } from "./PrintBorrowPDF";

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

export default function BorrowTable() {
	const [inventory, setInventory] = useState([]);
	const [items, setItems] = useState([]);
	const [showModal, setShowModal] = useState(false);

	const [name, setName] = useState("");
	const [labNo, setLabNo] = useState("");
	const [controlNo, setControlNo] = useState("");

	// 🔹 LOAD INVENTORY FROM ADMIN
	useEffect(() => {
		const saved = localStorage.getItem("inventory");
		if (saved) setInventory(JSON.parse(saved));
	}, []);

	const toggleItem = (item) => {
		const exists = items.find(i => i.id === item.id);
		if (exists) {
			setItems(items.filter(i => i.id !== item.id));
		} else {
			setItems([...items, { ...item, qty: 1 }]);
		}
	};

	const updateQty = (id, qty) => {
		setItems(items.map(i => i.id === id ? { ...i, qty } : i));
	};

	return (
		<div>
			{/* Borrower Info */}
			<div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
				<input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
				<input placeholder="Lab No" value={labNo} onChange={e => setLabNo(e.target.value)} />
				<input placeholder="Control Number" value={controlNo} onChange={e => setControlNo(e.target.value)} />
			</div>

			{/* Buttons */}
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
				<button
					onClick={() => setShowModal(true)}
					style={{
						padding: "8px 14px",
						background: "#0d47a1",
						color: "#fff",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer"
					}}
				>
					+ Add Item
				</button>

				<button
					onClick={() =>
						PrintBorrowPDF({
							name,
							labNo,
							controlNo,
							items
						})
					}
					style={{
						padding: "8px 14px",
						background: "#0d47a1",
						color: "#fff",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer"
					}}
				>
					Print Borrow Form
				</button>
			</div>

			{/* TABLE */}
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th style={th}>No</th>
						<th style={th}>Description</th>
						<th style={th}>Qty</th>
					</tr>
				</thead>
				<tbody>
					{items.length === 0 ? (
						<tr>
							<td colSpan="3" style={{ padding: "15px", textAlign: "center" }}>
								No borrowed items
							</td>
						</tr>
					) : (
						items.map((item, i) => (
							<tr key={item.id}>
								<td style={td}>{i + 1}</td>
								<td style={td}>{item.particular}</td>
								<td style={td}>
									<input
										type="number"
										min="1"
										value={item.qty}
										onChange={(e) => updateQty(item.id, e.target.value)}
										style={{ width: "60px", textAlign: "center" }}
									/>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{/* MODAL */}
			{showModal && (
				<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}>
					<div style={{
						background: "#fff",
						width: "400px",
						margin: "10% auto",
						padding: "20px",
						borderRadius: "8px"
					}}>
						<h3>Select Items</h3>

						{inventory.map(item => (
							<div key={item.id}>
								<input
									type="checkbox"
									checked={!!items.find(i => i.id === item.id)}
									onChange={() =>
										toggleItem({
											id: item.id,
											particular: item.particular
										})
									}
								/>
								{" "}{item.particular}
							</div>
						))}

						<div style={{ textAlign: "right", marginTop: "15px" }}>
							<button onClick={() => setShowModal(false)}>Done</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
