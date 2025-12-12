import { Link } from "react-router-dom";

export default function Sidebar() {
	return (
		<div style={{
			width: "230px",
			background: "#f5f5f5",
			padding: "20px",
			borderRight: "2px solid #e0e0e0",
			height: "100vh",
			boxSizing: "border-box"
		}}>
			<h3 style={{ color: "#1a73e8" }}>Admin Menu</h3>

			<ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
				<li style={{ marginBottom: "12px" }}>
					<Link style={{ color: "#1a73e8", fontWeight: "bold" }} to="/admin">
						📊 Dashboard
					</Link>
				</li>

				<li>
					<a href="#inventory" style={{ color: "#1a73e8", fontWeight: "bold" }}>
						📦 Inventory
					</a>
				</li>
			</ul>
		</div>
	);
}
