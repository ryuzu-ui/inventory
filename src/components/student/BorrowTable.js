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
	const [search, setSearch] = useState("");

	const [name, setName] = useState("");
	const [labNo, setLabNo] = useState("");
	const [controlNo, setControlNo] = useState("");

	/* LOAD INVENTORY */
	useEffect(() => {
		const saved = localStorage.getItem("inventory");
		if (saved) setInventory(JSON.parse(saved));
	}, []);

	/* ADD / REMOVE ITEM */
	const toggleItem = (item) => {
		const exists = items.find(i => i.id === item.id);

		if (exists) {
			setItems(items.filter(i => i.id !== item.id));
		} else {
			setItems([
				...items,
				{
					id: item.id,
					tools: item.tools,
					qty: 1,
					maxQty: item.qty
				}
			]);
		}
	};

	/* UPDATE QTY */
	const updateQty = (id, qty) => {
		setItems(items.map(i => {
			if (i.id !== id) return i;
			return {
				...i,
				qty: Math.max(1, Math.min(qty, i.maxQty))
			};
		}));
	};

	/* SEARCH FILTER */
	const filteredInventory = inventory.filter(item =>
		item.tools.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div>
			{/* BORROWER INFO */}
			<div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
				<input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
				<input placeholder="Lab No" value={labNo} onChange={e => setLabNo(e.target.value)} />
				<input placeholder="Control Number" value={controlNo} onChange={e => setControlNo(e.target.value)} />
			</div>

			{/* BUTTONS */}
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
				<button style={btnPrimary} onClick={() => setShowModal(true)}>
					+ Add Item
				</button>

				<button
					style={btnPrimary}
					onClick={() => PrintBorrowPDF({ name, labNo, controlNo, items })}
				>
					Print Borrow Form
				</button>
			</div>

			{/* BORROW TABLE */}
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th style={{ ...th, width: "5%" }}>No</th>
						<th style={{ ...th, width: "90%", textAlign: "left" }}>Tools</th>
						<th style={{ ...th, width: "5%" }}>Qty</th>
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
								<td style={{ ...td, width: "5%" }}>{i + 1}</td>

								<td style={{ ...td, width: "90%", textAlign: "left" }}>
									{item.tools}
								</td>

								<td style={{ ...td, width: "5%" }}>
									<input
										type="number"
										min="1"
										max={item.maxQty}
										value={item.qty}
										onChange={(e) =>
											updateQty(item.id, Number(e.target.value))
										}
										style={{
											width: "45px",
											textAlign: "center"
										}}
									/>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>


			{/* SELECT ITEM MODAL */}
			{showModal && (
				<div style={backdrop}>
					<div style={modal}>
						<h3>Select Items</h3>

						{/* SEARCH */}
						<input
							placeholder="Search tools..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{
								width: "100%",
								padding: "6px",
								marginBottom: "10px"
							}}
						/>

						<div style={{ maxHeight: "260px", overflowY: "auto" }}>
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr>
										<th style={{ ...th, width: "5%" }}></th>
										<th style={{ ...th, width: "90%", textAlign: "left" }}>Tools</th>
										<th style={{ ...th, width: "5%" }}>Avail</th>
									</tr>
								</thead>

								<tbody>
									{filteredInventory.length === 0 ? (
										<tr>
											<td colSpan="3" style={{ padding: "15px", textAlign: "center" }}>
												No items found
											</td>
										</tr>
									) : (
										filteredInventory.map(item => (
											<tr key={item.id}>
												<td style={{ ...td, width: "5%" }}>
													<input
														type="checkbox"
														checked={!!items.find(i => i.id === item.id)}
														onChange={() => toggleItem(item)}
													/>
												</td>

												<td style={{ ...td, width: "90%", textAlign: "left" }}>
													{item.tools}
												</td>

												<td style={{ ...td, width: "5%" }}>
													{item.qty}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>

						</div>

						<div style={{ textAlign: "right", marginTop: "15px" }}>
							<button onClick={() => setShowModal(false)}>Done</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* STYLES */
const btnPrimary = {
	padding: "8px 14px",
	background: "#0d47a1",
	color: "#fff",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer"
};

const backdrop = {
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.4)"
};

const modal = {
	background: "#fff",
	width: "520px",
	margin: "8% auto",
	padding: "20px",
	borderRadius: "8px"
};
