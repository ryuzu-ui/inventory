import { useEffect, useState } from "react";
import { PrintBorrowPDF } from "./PrintBorrowPDF";
import { getUser } from "../services/authService";
import { createBorrowRequest, getItems } from "../../helper/api";
import { useTheme } from "../../context/ThemeContext";

export default function BorrowTable() {
	const { theme, themeName } = useTheme();
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.innerWidth <= 768 : false
	);

	const [inventory, setInventory] = useState([]);
	const [items, setItems] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");
	const [message, setMessage] = useState("");

	const [name, setName] = useState("");
	const [labNo, setLabNo] = useState("");
	const [controlNo, setControlNo] = useState("");

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	/* ===== STYLES ===== */
	const th = {
		padding: "14px",
		border: themeName === "dark" ? "1px solid #aaa" : "1px solid #000",
		fontWeight: "600",
		fontSize: "14px",
		textAlign: "center",
		background: "#0d47a1",
		color: "#fff"
	};

	const td = {
		padding: "12px",
		border: themeName === "dark" ? "1px solid #888" : "1px solid #000",
		fontSize: "13.5px",
		textAlign: "center",
		color: theme.text,
		background: theme.card
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
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 20
	};

	const modal = {
		background: theme.card,
		color: theme.text,
		width: "520px",
		maxWidth: "92vw",
		margin: 0,
		padding: "20px",
		borderRadius: "8px",
		position: "relative",
		maxHeight: isMobile ? "85vh" : "80vh",
		overflowY: "auto",
		overflowX: "hidden",
		WebkitOverflowScrolling: "touch",
	};

	/* FIXED: input style always black text */
	const inputStyle = {
		padding: "8px 10px",
		borderRadius: "6px",
		border: "1px solid #000",
		background: "#ffffff",
		color: "#000000",
		fontSize: isMobile ? "16px" : "14px",
		boxSizing: "border-box",
	};

	/* ===== LOAD DATA ===== */
	useEffect(() => {
		(async () => {
			try {
				setMessage("");
				const data = await getItems();
				setInventory(Array.isArray(data) ? data : []);
			} catch (e) {
				console.error(e);
				setMessage("Failed to load inventory.");
			}
		})();
	}, []);

	useEffect(() => {
		const saved = JSON.parse(localStorage.getItem("student_borrow_items") || "[]");
		setItems(saved);
	}, []);

	useEffect(() => {
		localStorage.setItem("student_borrow_items", JSON.stringify(items));
	}, [items]);

	/* ===== FUNCTIONS ===== */
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
					qty: 1,
					maxQty: item.quantity ?? 0
				}
			]);
		}
	};

	const updateQty = (id, qty) => {
		setItems(items.map(i =>
			i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty)) } : i
		));
	};

	const confirmBorrow = async () => {
		const user = getUser();
		if (!user) return;

		if (items.length === 0) {
			return setMessage("Please add at least one item.");
		}

		try {
			await createBorrowRequest({
				student_id: Number(user.id),
				items: items.map(i => ({
					item_id: i.id,
					quantity: i.qty
				}))
			});

			setItems([]);
			setShowModal(false);
			setMessage("✅ Borrow request submitted.");

			const refreshed = await getItems();
			setInventory(refreshed);
		} catch (e) {
			setMessage(e.message || "Failed to submit.");
		}
	};

	const filteredInventory = inventory.filter(item =>
		item.item_name?.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div>
			{/* INPUTS */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
				<input
					placeholder="Name"
					value={name}
					onChange={e => setName(e.target.value)}
					style={{ ...inputStyle, flex: "1 1 160px" }}
				/>
				<input
					placeholder="Lab No"
					value={labNo}
					onChange={e => setLabNo(e.target.value)}
					style={{ ...inputStyle, flex: "1 1 160px" }}
				/>
				<input
					placeholder="Control Number"
					value={controlNo}
					onChange={e => setControlNo(e.target.value)}
					style={{ ...inputStyle, flex: "1 1 160px" }}
				/>
			</div>

			{/* BUTTONS */}
			<div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
				<button style={btnPrimary} onClick={() => setShowModal(true)}>+ Add Item</button>

				<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
					<button style={btnPrimary} onClick={() => PrintBorrowPDF({ name, labNo, controlNo, items })}>
						Print
					</button>
					<button style={{ ...btnPrimary, background: "#2e7d32" }} onClick={confirmBorrow}>
						Confirm
					</button>
				</div>
			</div>

			{message && <div style={{ marginBottom: 10 }}>{message}</div>}

			{/* TABLE */}
			<div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
				<table
					style={{
						width: "100%",
						minWidth: "420px",
						borderCollapse: "collapse",
						background: theme.card,
						color: theme.text,
						border: themeName === "dark" ? "2px solid #aaa" : "2px solid #000"
					}}
				>
				<thead>
					<tr>
						<th style={th}>No</th>
						<th style={{ ...th, textAlign: "left" }}>Item</th>
						<th style={th}>Qty</th>
					</tr>
				</thead>

				<tbody>
					{items.length === 0 ? (
						<tr>
							<td colSpan="3" style={td}>No items</td>
						</tr>
					) : (
						items.map((item, i) => (
							<tr key={item.id}>
								<td style={td}>{i + 1}</td>
								<td style={{ ...td, textAlign: "left" }}>{item.item_name}</td>
								<td style={td}>
									<input
										type="number"
										value={item.qty}
										onChange={(e) => updateQty(item.id, Number(e.target.value))}
										style={{
											width: "60px",
											border: "1px solid #000",
											color: "#000000",
											background: "#ffffff",
											fontSize: isMobile ? "16px" : "14px",
										}}
									/>
								</td>
							</tr>
						))
					)}
				</tbody>
				</table>
			</div>

			{/* MODAL */}
			{showModal && (
				<div className="app-backdrop" style={backdrop} onClick={() => setShowModal(false)}>
					<div className="app-modal" style={modal} onClick={(e) => e.stopPropagation()}>

						{/* CLOSE BUTTON */}
						<button
							onClick={() => setShowModal(false)}
							style={{
								position: "absolute",
								top: "10px",
								right: "12px",
								background: "transparent",
								border: "none",
								fontSize: "20px",
								cursor: "pointer",
								color: theme.text
							}}
						>
							✕
						</button>

						<h3>Select Items</h3>

						<input
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Search..."
							style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
						/>

						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<tbody>
								{filteredInventory.map(item => (
									<tr key={item.id}>
										<td style={td}>
											<input
												type="checkbox"
												checked={!!items.find(i => i.id === item.id)}
												onChange={() => toggleItem(item)}
											/>
										</td>
										<td style={td}>{item.item_name}</td>
									</tr>
								))}
							</tbody>
						</table>

						<div style={{ marginTop: "10px", textAlign: "right" }}>
							<button onClick={() => setShowModal(false)}>Done</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

