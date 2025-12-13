import { useState } from "react";
import "./AddItemModal.css";

export default function AddItemModal({ onSave, onClose }) {
	const [form, setForm] = useState({
		tools: "",
		particular: "",
		purchaseDate: "",
		qty: 0,
		additionalQty: 0,
		lifeSpan: "",
		replaced: 0,
		missing: 0,
		breakage: 0,
		defective: 0,
		ched: "",
		tesda: "",
		deped: ""
	});

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSave = () => {
		onSave(form);
	};

	return (
		<div className="modal-backdrop">
			<div className="modal">
				<div className="modal-header">
					<h3>Add Inventory Item</h3>
					<button onClick={onClose}>✕</button>
				</div>

				<div className="modal-body">
					<Input label="Tools" name="tools" onChange={handleChange} />
					<Input label="Particular" name="particular" onChange={handleChange} />
					<Input label="Purchase Date" type="date" name="purchaseDate" onChange={handleChange} />
					<Input label="Qty" type="number" name="qty" onChange={handleChange} />
					<Input label="Add Qty" type="number" name="additionalQty" onChange={handleChange} />
					<Input label="Life Span" name="lifeSpan" onChange={handleChange} />
					<Input label="Replaced" type="number" name="replaced" onChange={handleChange} />
					<Input label="Missing" type="number" name="missing" onChange={handleChange} />
					<Input label="Breakage" type="number" name="breakage" onChange={handleChange} />
					<Input label="Defective" type="number" name="defective" onChange={handleChange} />
					<Input label="CHED" name="ched" onChange={handleChange} />
					<Input label="TESDA" name="tesda" onChange={handleChange} />
					<Input label="DEPED" name="deped" onChange={handleChange} />
				</div>

				<div className="modal-footer">
					<button className="btn cancel" onClick={onClose}>Cancel</button>
					<button className="btn save" onClick={handleSave}>Save</button>
				</div>
			</div>
		</div>
	);
}

function Input({ label, type = "text", name, onChange }) {
	return (
		<div className="field">
			<label>{label}</label>
			<input type={type} name={name} onChange={onChange} />
		</div>
	);
}
