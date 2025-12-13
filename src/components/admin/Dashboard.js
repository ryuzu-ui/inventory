export default function Dashboard() {
	const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");

	const totalItems = inventory.length;
	const totalQty = inventory.reduce(
		(sum, item) => sum + Number(item.qty || 0),
		0
	);

	return (
		<div>
			<h2>Dashboard</h2>

			<div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
				<div style={card}>
					<h4>Total Items</h4>
					<b>{totalItems}</b>
				</div>

				<div style={card}>
					<h4>Total Quantity</h4>
					<b>{totalQty}</b>
				</div>
			</div>
		</div>
	);
}

const card = {
	padding: "16px",
	background: "#f5f7fa",
	borderRadius: "8px",
	minWidth: "160px"
};
