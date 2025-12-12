export default function Header() {
	return (
		<div style={{
			width: "100%",
			padding: "15px 25px",
			background: "#1a73e8",
			color: "white",
			fontSize: "22px",
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
		}}>
			<div style={{ fontWeight: "bold" }}>
				CTHM Custodian Inventory System
			</div>

			<div>
				<button style={{
					background: "#fff9c4",
					border: "none",
					padding: "8px 15px",
					marginRight: "10px",
					borderRadius: "6px",
					cursor: "pointer"
				}}>Home</button>

				<button style={{
					background: "#fff9c4",
					border: "none",
					padding: "8px 15px",
					borderRadius: "6px",
					cursor: "pointer"
				}}>Logout</button>
			</div>
		</div>
	);
}
