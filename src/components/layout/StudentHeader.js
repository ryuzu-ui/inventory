export default function StudentHeader({ onMenuClick }) {
	return (
		<div
			style={{
				height: "60px",
				background: "#0d47a1",
				color: "white",
				display: "flex",
				alignItems: "center",
				padding: "0 20px"
				// ❌ REMOVE position: fixed
				// ❌ REMOVE zIndex
			}}
		>
			<button
				onClick={onMenuClick}
				style={{
					fontSize: "22px",
					background: "transparent",
					border: "none",
					color: "white",
					cursor: "pointer",
					marginRight: "15px"
				}}
			>
				☰
			</button>

			<b>Student Borrowing Portal</b>
		</div>
	);
}
