import { useEffect, useState } from "react";
import "./AddItemModal.css";

const EMPTY_FORM = {
	item_code: "",
	item_name: "",
	category: "",
	quantity: 0
};

export default function AddItemModal({ onSave, onClose, item }) {
	const [form, setForm] = useState(EMPTY_FORM);

	/* 🔹 LOAD DATA WHEN EDITING / RESET WHEN CREATING */
	useEffect(() => {
		if (item) {
			setForm({
				item_code: item.item_code ?? "",
				item_name: item.item_name ?? "",
				category: item.category ?? "",
				quantity: item.quantity ?? 0
			});
		} else {
			setForm(EMPTY_FORM); // ✅ RESET FORM ON CREATE
		}
	}, [item]);

	const handleChange = (e) => {
		const { name, value, type } = e.target;

		setForm(prev => ({
			...prev,
			[name]:
				type === "number"
					? value === "" ? 0 : Number(value)
					: value
		}));
	};

	const handleSave = () => {
		onSave(form);
	};

	return (
		<div className="modal-backdrop">
			<div className="modal">
				<div className="modal-header">
					<h3>{item ? "Update Inventory Item" : "Add Inventory Item"}</h3>
					<button onClick={onClose}>✕</button>
				</div>

				<div className="modal-body">
					<Input label="Item Code" name="item_code" value={form.item_code} onChange={handleChange} />
					<Input label="Item Name" name="item_name" value={form.item_name} onChange={handleChange} />
					<Input label="Category" name="category" value={form.category} onChange={handleChange} />
					<Input label="Quantity" type="number" name="quantity" value={form.quantity} onChange={handleChange} />
				</div>

				<div className="modal-footer">
					<button className="btn cancel" onClick={onClose}>Cancel</button>
					<button className="btn save" onClick={handleSave}>Save</button>
				</div>
			</div>
		</div>
	);
}

function Input({ label, type = "text", name, value, onChange }) {
	return (
		<div className="field">
			<label>{label}</label>
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}
