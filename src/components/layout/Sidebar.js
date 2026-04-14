import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { useTheme } from "../../context/ThemeContext";

export default function Sidebar({ open, onClose, onNavigate }) {
	const navigate = useNavigate();
	const { theme } = useTheme();
	return (
		<>
			{open && (
				<div
					onClick={onClose}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.35)",
						zIndex: 9,
					}}
				/>
			)}

			<div
				style={{
					position: "fixed",
					top: 0,
					left: open ? 0 : "-260px",
					width: "260px",
					height: "100dvh",
					maxHeight: "100vh",
					background: theme.sidebar,
					borderRight: `1px solid ${theme.border}`,
					transition: "left 0.3s ease",
					zIndex: 10,
					padding: "20px",
					paddingBottom: "40px",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					overflowY: "auto",
					WebkitOverflowScrolling: "touch",
				}}
			>
				<div
					onClick={onClose}
					style={{
						marginBottom: "25px",
						cursor: "pointer",
						fontWeight: "bold",
						color: theme.text,
					}}
				>
					← Back
				</div>

				<div style={{ flex: 1 }}>
					<MenuItem
						label="Dashboard"
						onClick={() => {
							onNavigate("dashboard");
							onClose();
						}}
					/>
					<MenuItem
						label="Inventory"
						onClick={() => {
							onNavigate("inventory");
							onClose();
						}}
					/>
					<MenuItem
						label="Calendar"
						onClick={() => {
							onNavigate("calendar");
							onClose();
						}}
					/>
					<MenuItem
						label="Borrow Requests"
						onClick={() => {
							onNavigate("borrow_requests");
							onClose();
						}}
					/>
					<MenuItem
						label="Problem Reports"
						onClick={() => {
							onNavigate("problem_reports");
							onClose();
						}}
					/>

					<MenuItem
						label="FAQ Manager"
						onClick={() => {
							onNavigate("faq");
							onClose();
						}}
					/>

					<MenuItem
						label="Users"
						onClick={() => {
							onNavigate("users");
							onClose();
						}}
					/>
				</div>

				<div
					style={{
						position: "sticky",
						bottom: 0,
						background: theme.sidebar,
						paddingTop: "10px",
					}}
				>
					<MenuItem
						label="Logout"
						onClick={() => {
							logout();
							navigate("/");
							onClose();
						}}
						isLogout
					/>
				</div>
			</div>
		</>
	);
}

function MenuItem({ label, onClick, isLogout }) {
	const { theme } = useTheme();
	return (
		<div
			onClick={onClick}
			style={{
				padding: "12px 14px",
				borderRadius: "8px",
				cursor: "pointer",
				marginBottom: "8px",
				fontWeight: "500",
				color: isLogout ? "#d32f2f" : theme.text,
				transition: "0.2s",
			}}

			onMouseEnter={(e) => {
				e.currentTarget.style.background = isLogout ? "#d32f2f" : "#0d47a1";
				e.currentTarget.style.color = "white";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "transparent";
				e.currentTarget.style.color = isLogout ? "#d32f2f" : theme.text;
			}}
		>
			{label}
		</div>
	);
}