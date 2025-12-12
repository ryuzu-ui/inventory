import { useState } from "react";

export default function AddEditItemModal({ close, save, item }) {
	const [name, setName] = useState(item ? item.name : "");
	const [qty, setQty] = useState(item ? item.qty : 1);

	const handleSubmit = () => {
		save({ id: item?.id, name, qty });
	};

	return (
		<div style={{
			position: "fixed",
			top: 0, left: 0,
			width: "100%",
			height: "100%",
			background: "rgba(0,0,0,0.5)",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			padding: "20px",
			zIndex: 9999
		}}>
			<div style={{
				background: "white",
				padding: "20px",
				width: "400px",
				maxHeight: "80vh",
				overflowY: "auto",
				borderRadius: "10px",
				border: "2px solid #1a73e8"
			}}>

				<h2 style={{ color: "#1a73e8" }}>
					{item ? "Edit Item" : "Add Item"}
				</h2>

				<label>Description</label>
				<input
					style={{
						width: "100%",
						padding: "8px",
						border: "1px solid #1a73e8",
						marginBottom: "10px"
					}}
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<label>Quantity</label>
				<input
					type="number"
					style={{
						width: "100%",
						padding: "8px",
						border: "1px solid #1a73e8"
					}}
					value={qty}
					onChange={(e) => setQty(e.target.value)}
				/>

				<div style={{ marginTop: "15px", textAlign: "right" }}>
					<button
						style={{
							padding: "8px 15px",
							marginRight: "10px",
							background: "#1a73e8",
							color: "white",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer"
						}}
						onClick={handleSubmit}
					>
						Save
					</button>

					<button
						style={{
							padding: "8px 15px",
							background: "#e53935",
							color: "white",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer"
						}}
						onClick={close}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
