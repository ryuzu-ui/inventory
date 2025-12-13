import { useState } from "react";
import AddItemModal from "./AddItemModal";

/* TABLE STYLES */
const th = {
	padding: "10px",
	border: "1px solid #e0e0e0",
	fontWeight: "600",
	fontSize: "12px",
	textAlign: "center",
	whiteSpace: "nowrap",
	background: "#f5f7fa"
};

const td = {
	padding: "8px",
	border: "1px solid #e0e0e0",
	fontSize: "12px",
	textAlign: "center",
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis"
};

export default function InventoryTable({ items = [], setItems }) {
	const [showModal, setShowModal] = useState(false);

	const addItem = (newItem) => {
	const updated = [...items, { ...newItem, id: Date.now() }];

	setItems(updated);

	// ✅ SAVE TO LOCALSTORAGE
	localStorage.setItem("inventory_items", JSON.stringify(updated));

	setShowModal(false);
};


	return (
		<div style={{ width: "100%" }}>
			{/* TOP BAR */}
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: "15px"
			}}>
				<div style={{ fontSize: "22px", fontWeight: "600", color: "white" }}>
					Items
					<button
						onClick={() => setShowModal(true)}
						style={{
							marginLeft: "15px",
							background: "#0d47a1",
							color: "white",
							border: "none",
							padding: "8px 16px",
							borderRadius: "6px",
							cursor: "pointer",
							fontSize: "13px"
						}}
					>
						+ Create
					</button>
				</div>

				<div>
					<button style={btn}>PDF</button>
					<button style={btn}>CSV</button>
					<button style={btn}>Import CSV</button>
				</div>
			</div>

			{/* TABLE CONTAINER */}
			<div style={{
				background: "white",
				borderRadius: "8px",
				overflow: "hidden",
				boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
			}}>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						tableLayout: "fixed"
					}}
				>
					<thead>
						<tr>
							{[
								"No.",
								"Tools",
								"Particular",
								"Date",
								"Qty",
								"Add Qty",
								"Life Span",
								"Replaced",
								"Total",
								"Missing",
								"Breakage",
								"Defective",
								"Total Loss",
								"End",
								"CHED",
								"TESDA",
								"DEPED"
							].map(h => (
								<th key={h} style={th}>{h}</th>
							))}
						</tr>
					</thead>

					<tbody>
						{items.length === 0 ? (
							<tr>
								<td colSpan="17" style={{ padding: "20px", textAlign: "center", color: "#777" }}>
									No items yet. Click <b>+ Create</b> to add.
								</td>
							</tr>
						) : (
							items.map((item, i) => (
								<tr key={item.id}>
									<td style={td}>{i + 1}</td>
									<td style={td}>{item.tools}</td>
									<td style={td}>{item.particular}</td>
									<td style={td}>{item.purchaseDate}</td>
									<td style={td}>{item.qty}</td>
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
			</div>

			{showModal &&
				<AddItemModal
					onSave={addItem}
					onClose={() => setShowModal(false)}
				/>
			}
		</div>
	);
}

const btn = {
	marginLeft: "6px",
	padding: "7px 12px",
	borderRadius: "6px",
	border: "1px solid #dadce0",
	background: "#f1f3f4",
	cursor: "pointer",
	fontSize: "12px"
};
