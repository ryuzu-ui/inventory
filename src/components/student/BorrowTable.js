import { useEffect, useState } from "react";
import { PrintBorrowPDF } from "./PrintBorrowPDF";
import { getUser } from "../services/authService";
import { createBorrowRequest, getItems } from "../../helper/api";


/* ================= STYLES ================= */

const th = {
	padding: "14px",
	border: "1px solid #cfd8e3",
	fontWeight: "600",
	fontSize: "14px",
	textAlign: "center",
	background: "#0d47a1",
	color: "#fff",
	whiteSpace: "nowrap"
};

const td = {
	padding: "12px",
	border: "1px solid #e0e6ef",
	fontSize: "13.5px",
	textAlign: "center",
	color: "#102a43",
	background: "#fff"
};

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
	background: "rgba(0,0,0,0.4)",
	zIndex: 20
};

const modal = {
	background: "#fff",
	color: "black",        
	width: "520px",
	margin: "8% auto",
	padding: "20px",
	borderRadius: "8px"
};

/* ================= COMPONENT ================= */

export default function BorrowTable() {
	const [inventory, setInventory] = useState([]);
	const [items, setItems] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");
	const [message, setMessage] = useState("");

	const [name, setName] = useState("");
	const [labNo, setLabNo] = useState("");
	const [controlNo, setControlNo] = useState("");

	/* ===== LOAD INVENTORY (DB ITEMS) ===== */
	useEffect(() => {
		(async () => {
			try {
				setMessage("");
				const data = await getItems();
				setInventory(Array.isArray(data) ? data : []);
			} catch (e) {
				console.error("getItems error:", e);
				setInventory([]);
				setMessage(e.message || "Failed to load inventory.");
			}
		})();
	}, []);

	/* ===== LOAD SAVED BORROW ITEMS ===== */
	useEffect(() => {
		const saved = JSON.parse(
			localStorage.getItem("student_borrow_items") || "[]"
		);
		setItems(saved);
	}, []);

	/* ===== AUTO SAVE BORROW ITEMS ===== */
	useEffect(() => {
		localStorage.setItem(
			"student_borrow_items",
			JSON.stringify(items)
		);
	}, [items]);

	/* ===== ADD / REMOVE ITEM ===== */
	const toggleItem = (item) => {
		const exists = items.find(i => i.id === item.id);

		if (exists) {
			setItems(items.filter(i => i.id !== item.id));
		} else {
			setItems([
				...items,
				{
					id: item.id,
					item_name: item.item_name,
					item_code: item.item_code,
					category: item.category,
					qty: 1,
					maxQty: item.quantity ?? 0
				}
			]);
		}
	};


	/* ===== UPDATE QUANTITY ===== */
	const updateQty = (id, qty) => {
		setItems(items.map(i => {
			if (i.id !== id) return i;
			return {
				...i,
				qty: Math.max(1, Math.min(qty, i.maxQty))
			};
		}));
	};

	/* ===== CONFIRM BORROW (CREATE BORROW REQUEST) ===== */
	const confirmBorrow = async () => {
		const user = getUser();
		if (!user) return;
		setMessage("");

		const studentId = Number(user?.id);
		if (!Number.isInteger(studentId) || studentId <= 0) {
			return setMessage("You must be logged in to borrow.");
		}

		if (items.length === 0) {
			return setMessage("Please add at least one item.");
		}

		try {
			await createBorrowRequest({
				student_id: studentId,
				items: items.map((i) => ({
					item_id: i.id,
					quantity: i.qty,
				})),
			});

			setItems([]);
			setShowModal(false);
			setMessage("✅ Borrow request submitted (pending approval). ");

			// refresh inventory quantities view
			const refreshed = await getItems();
			setInventory(Array.isArray(refreshed) ? refreshed : []);
		} catch (e) {
			console.error("createBorrowRequest error:", e);
			setMessage(e.message || "Failed to submit borrow request.");
		}
	};




	/* ===== SEARCH FILTER ===== */
	const filteredInventory = inventory.filter(item => {
		const s = search.toLowerCase();
		return (
			String(item.item_name || "").toLowerCase().includes(s) ||
			String(item.item_code || "").toLowerCase().includes(s) ||
			String(item.category || "").toLowerCase().includes(s)
		);
	});

	return (
		<div>
			{/* ===== BORROWER INFO ===== */}
			<div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
				<input
					placeholder="Name"
					value={name}
					onChange={e => setName(e.target.value)}
				/>
				<input
					placeholder="Lab No"
					value={labNo}
					onChange={e => setLabNo(e.target.value)}
				/>
				<input
					placeholder="Control Number"
					value={controlNo}
					onChange={e => setControlNo(e.target.value)}
				/>
			</div>

			{/* ===== BUTTONS ===== */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "15px",
					gap: "10px"
				}}
			>
				<button style={btnPrimary} onClick={() => setShowModal(true)}>
					+ Add Item
				</button>

				<div style={{ display: "flex", gap: "10px" }}>
					<button
						style={btnPrimary}
						onClick={() =>
							PrintBorrowPDF({ name, labNo, controlNo, items })
						}
					>
						Print Borrow Form
					</button>

					<button
						style={{ ...btnPrimary, background: "#2e7d32" }}
						onClick={confirmBorrow}
					>
						Confirm Borrow
					</button>
				</div>
			</div>

			{message && (
				<div style={{ marginBottom: 12, fontWeight: 600, opacity: 0.95 }}>
					{message}
				</div>
			)}

			{/* ===== BORROW TABLE ===== */}
			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
					tableLayout: "fixed",
					background: "#fff",
					overflow: "hidden",
					boxShadow: "0 6px 18px rgba(13,71,161,0.12)"
				}}
			>
				<thead>
					<tr>
						<th style={{ ...th, width: "33.33%" }}>No</th>
						<th style={{ ...th, width: "33.33%", textAlign: "left" }}>Items</th>
						<th style={{ ...th, width: "33.33%" }}>Qty</th>
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
							<tr
								key={item.id}
								style={{
									background: i % 2 === 0 ? "#ffffff" : "#eef3fb",
									transition: "background 0.2s ease"
								}}
							>
								<td style={td}>{i + 1}</td>
								<td style={{ ...td, textAlign: "left" }}>
									{item.item_name}
								</td>
								<td style={td}>
									<input
										type="number"
										min="1"
										max={item.maxQty}
										value={item.qty}
										onChange={(e) =>
											updateQty(item.id, Number(e.target.value))
										}
										style={{
											width: "60px",
											padding: "6px",
											textAlign: "center",
											borderRadius: "6px",
											border: "1px solid #cfd8e3",
											fontSize: "13px"
										}}
									/>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{/* ===== SELECT ITEM MODAL ===== */}
			{/* ===== SELECT ITEM MODAL ===== */}
			{showModal && (
				<div style={backdrop}>
					<div style={modal}>
						<h3>Select Items</h3>

						<input
							placeholder="Search items..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{ width: "100%", padding: "6px", marginBottom: "10px", color: "black", background: "#fff" }}
						/>

						<div style={{ maxHeight: "260px", overflowY: "auto" }}>
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr>
										<th style={{ ...th, width: "5%" }}></th>
										<th style={{ ...th, width: "90%", textAlign: "left" }}>
											Item
										</th>
										<th style={{ ...th, width: "5%" }}>Avail</th>
									</tr>
								</thead>

								<tbody>
									{filteredInventory.length === 0 ? (
										<tr>
											<td
												colSpan="3"
												style={{ padding: "15px", textAlign: "center" }}
											>
												No items found
											</td>
										</tr>
									) : (
										filteredInventory.map(item => {
											const available = item.quantity ?? 0;
											const selected = items.find(i => i.id === item.id);

											return (
												<tr key={item.id}>
													<td style={td}>
														<input
															type="checkbox"
															checked={!!selected}
															disabled={available <= 0}
															onChange={() => toggleItem(item)}
														/>
													</td>

													<td style={{ ...td, textAlign: "left" }}>
														{item.item_name}
													</td>

													<td style={td}>
														{available <= 0 ? (
															<span style={{ color: "red" }}>0</span>
														) : (
															available
														)}
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						<div style={{ textAlign: "right", marginTop: "15px" }}>
							<button onClick={() => setShowModal(false)}style={{ color: "black" }}>Done</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
