export default function StudentSidebar({ open, onClose, onNavigate }) {
	return (
		<>
			{/* OVERLAY */}
			{open && (
				<div
					onClick={onClose}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.35)",
						zIndex: 19
					}}
				/>
			)}

			{/* SIDEBAR */}
			<div
				style={{
					position: "fixed",
					top: 0,
					left: open ? 0 : "-260px",
					width: "260px",
					height: "100vh",
					background: "#f8f9fa",
					borderRight: "1px solid #ddd",
					transition: "left 0.3s ease",
					zIndex: 20, // 🔥 TAKPAN HEADER
					padding: "20px",
					boxSizing: "border-box"
				}}
			>
				<div
					onClick={onClose}
					style={{
						marginBottom: "25px",
						cursor: "pointer",
						fontWeight: "bold",
						color: "#0d47a1"
					}}
				>
					← Back
				</div>

				<MenuItem label="Home" onClick={() => onNavigate("home")} />
				<MenuItem label="Borrow" onClick={() => onNavigate("borrow")} />
				<MenuItem label="Calendar" onClick={() => onNavigate("calendar")} />
			</div>
		</>
	);
}

function MenuItem({ label, onClick }) {
	return (
		<div
			onClick={onClick}
			style={{
				padding: "12px 14px",
				borderRadius: "8px",
				cursor: "pointer",
				marginBottom: "8px",
				fontWeight: "500",
				color: "#333",
				transition: "0.2s"
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "#0d47a1";
				e.currentTarget.style.color = "white";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "transparent";
				e.currentTarget.style.color = "#333";
			}}
		>
			{label}
		</div>
	);
}
