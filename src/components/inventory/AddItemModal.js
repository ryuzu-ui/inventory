import { useEffect, useState } from "react";
import "./AddItemModal.css";

const EMPTY_FORM = {
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
};

export default function AddItemModal({ onSave, onClose, item }) {
	const [form, setForm] = useState(EMPTY_FORM);

	/* 🔹 LOAD DATA WHEN EDITING / RESET WHEN CREATING */
	useEffect(() => {
		if (item) {
			setForm({
				tools: item.tools ?? "",
				particular: item.particular ?? "",
				purchaseDate: item.purchaseDate ?? "",
				qty: item.qty ?? 0,
				additionalQty: item.additionalQty ?? 0,
				lifeSpan: item.lifeSpan ?? "",
				replaced: item.replaced ?? 0,
				missing: item.missing ?? 0,
				breakage: item.breakage ?? 0,
				defective: item.defective ?? 0,
				ched: item.ched ?? "",
				tesda: item.tesda ?? "",
				deped: item.deped ?? ""
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
					<Input label="Tools" name="tools" value={form.tools} onChange={handleChange} />
					<Input label="Particular" name="particular" value={form.particular} onChange={handleChange} />
					<Input label="Purchase Date" type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} />
					<Input label="Qty" type="number" name="qty" value={form.qty} onChange={handleChange} />
					<Input label="Add Qty" type="number" name="additionalQty" value={form.additionalQty} onChange={handleChange} />
					<Input label="Life Span" name="lifeSpan" value={form.lifeSpan} onChange={handleChange} />
					<Input label="Replaced" type="number" name="replaced" value={form.replaced} onChange={handleChange} />
					<Input label="Missing" type="number" name="missing" value={form.missing} onChange={handleChange} />
					<Input label="Breakage" type="number" name="breakage" value={form.breakage} onChange={handleChange} />
					<Input label="Defective" type="number" name="defective" value={form.defective} onChange={handleChange} />
					<Input label="CHED" name="ched" value={form.ched} onChange={handleChange} />
					<Input label="TESDA" name="tesda" value={form.tesda} onChange={handleChange} />
					<Input label="DEPED" name="deped" value={form.deped} onChange={handleChange} />
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
