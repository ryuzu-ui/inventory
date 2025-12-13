import { useState } from "react";
import SelectItemModal from "./SelectItemModal";

/* SAME TABLE STYLES AS ADMIN */
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

export default function BorrowTable() {
	const [items, setItems] = useState([]);
	const [showModal, setShowModal] = useState(false);

	return (
		<div style={{ width: "100%" }}>
			{/* TOP BAR */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "15px"
				}}
			>
				<button
					onClick={() => setShowModal(true)}
					style={{
						background: "#0d47a1",
						color: "white",
						border: "none",
						padding: "8px 16px",
						borderRadius: "6px",
						cursor: "pointer",
						fontSize: "13px"
					}}
				>
					+ Add Item
				</button>

				<div>
					<button style={btn}>PDF</button>
					<button style={btn}>CSV</button>
				</div>
			</div>

			{/* TABLE CONTAINER */}
			<div
				style={{
					background: "white",
					borderRadius: "8px",
					overflow: "hidden",
					boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
				}}
			>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						tableLayout: "fixed"
					}}
				>
					<thead>
						<tr>
							<th style={th}>No.</th>
							<th style={th}>Description</th>
							<th style={th}>Qty</th>
							<th style={th}>Released</th>
							<th style={th}>Returned</th>
							<th style={th}>Unreturned</th>
							<th style={th}>Remarks</th>
						</tr>
					</thead>

					<tbody>
						{items.length === 0 ? (
							<tr>
								<td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#777" }}>
									No borrowed items yet
								</td>
							</tr>
						) : (
							items.map((item, i) => (
								<tr key={item.id}>
									<td style={td}>{i + 1}</td>
									<td style={td}>{item.description}</td>
									<td style={td}>{item.qty}</td>
									<td style={td}>{item.released}</td>
									<td style={td}>{item.returned}</td>
									<td style={td}>{item.unreturned}</td>
									<td style={td}>{item.remarks}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{showModal && (
				<SelectItemModal
					onClose={() => setShowModal(false)}
					onSave={(selectedItems) => {
						setItems(selectedItems);
						setShowModal(false);
					}}
				/>
			)}
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
