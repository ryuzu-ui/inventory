import { useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Dummy items for selection
const TEMP_ITEMS = [
	{ id: 1, description: "Hammer", available: 10 },
	{ id: 2, description: "Screwdriver Set", available: 15 },
	{ id: 3, description: "Multimeter", available: 5 },
	{ id: 4, description: "Power Drill", available: 3 },
	{ id: 5, description: "Pliers", available: 7 },
];

// Table styles
const th = { padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", fontSize: "12px", textAlign: "center", background: "#f5f7fa" };
const td = { padding: "8px", border: "1px solid #e0e0e0", fontSize: "12px", textAlign: "center" };
const btn = { marginLeft: "6px", padding: "7px 12px", borderRadius: "6px", border: "1px solid #dadce0", background: "#f1f3f4", cursor: "pointer", fontSize: "12px" };

export default function BorrowTable() {
	const [items, setItems] = useState([]);
	const [showModal, setShowModal] = useState(false);

	// Borrower info
	const [borrowerName, setBorrowerName] = useState("");
	const [labNumber, setLabNumber] = useState("");
	const [controlNumber, setControlNumber] = useState("");

	// Toggle item in selection
	const toggleItem = (item) => {
		const exists = items.find(i => i.id === item.id);
		if (exists) setItems(items.filter(i => i.id !== item.id));
		else setItems([...items, { ...item, qty: 1 }]);
	};

	// Update quantity
	const updateQty = (id, qty) => {
		setItems(items.map(i => i.id === id ? { ...i, qty } : i));
	};

	// Export DOCX
	const exportToDoc = async () => {
		const fixedRows = 5;
		const dataForTemplate = {
			name: borrowerName,
			lab_no: labNumber,
			control_number: controlNumber
		};

		for (let i = 0; i < fixedRows; i++) {
			const item = items[i];
			dataForTemplate[`item_no${i + 1}`] = item ? i + 1 : "";
			dataForTemplate[`item_desc${i + 1}`] = item ? item.description : "";
			dataForTemplate[`item_qty${i + 1}`] = item ? item.qty : "";
		}

		try {
			const response = await fetch("/templates/borrow_template.docx");
			if (!response.ok) throw new Error(`Template fetch failed: ${response.status}`);
			const arrayBuffer = await response.arrayBuffer();

			const zip = new PizZip(arrayBuffer);
			const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

			doc.setData(dataForTemplate);
			doc.render();

			const blob = doc.getZip().generate({ type: "blob" });
			saveAs(blob, "borrowed-items.docx");
		} catch (err) {
			console.error("Failed to generate DOCX:", err);
			alert("Check console for DOCX error details");
		}
	};

	return (
		<div style={{ width: "100%" }}>
			{/* Borrower Info */}
			<div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
				<input placeholder="Name" value={borrowerName} onChange={e => setBorrowerName(e.target.value)} />
				<input placeholder="Lab No" value={labNumber} onChange={e => setLabNumber(e.target.value)} />
				<input placeholder="Control Number" value={controlNumber} onChange={e => setControlNumber(e.target.value)} />
			</div>

			{/* Top Bar */}
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
				<button onClick={() => setShowModal(true)} style={{ background: "#0d47a1", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
					+ Add Item
				</button>
				<button style={btn} onClick={exportToDoc}>Print / Export</button>
			</div>

			{/* Items Table */}
			<div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
					<thead>
						<tr>
							<th style={th}>No.</th>
							<th style={th}>Description</th>
							<th style={th}>Qty</th>
						</tr>
					</thead>
					<tbody>
						{items.length === 0
							? <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#777" }}>No borrowed items yet</td></tr>
							: items.map((item, i) => (
								<tr key={item.id}>
									<td style={td}>{i + 1}</td>
									<td style={td}>{item.description}</td>
									<td style={td}>
										<input
											type="number"
											min="1"
											value={item.qty}
											onChange={(e) => updateQty(item.id, e.target.value)}
											style={{ width: "60px", textAlign: "center", borderRadius: "4px", border: "1px solid #ccc" }}
										/>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{showModal && (
				<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.35)", zIndex: 20 }}>
					<div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", padding: "20px", borderRadius: "10px", width: "400px", zIndex: 21 }}>
						<h3>Select Items</h3>
						<table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
							<thead>
								<tr>
									<th></th>
									<th>Description</th>
									<th>Available</th>
								</tr>
							</thead>
							<tbody>
								{TEMP_ITEMS.map(item => (
									<tr key={item.id}>
										<td>
											<input type="checkbox" checked={!!items.find(i => i.id === item.id)} onChange={() => toggleItem(item)} />
										</td>
										<td>{item.description}</td>
										<td>{item.available}</td>
									</tr>
								))}
							</tbody>
						</table>
						<div style={{ textAlign: "right", marginTop: "15px" }}>
							<button onClick={() => setShowModal(false)} style={btn}>Cancel</button>
							<button onClick={() => setShowModal(false)} style={{ ...btn, background: "#1a73e8", color: "white", border: "none" }}>Done</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
