import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function StudentHeader({ onMenuClick }) {
	const [showProfile, setShowProfile] = useState(false);
	const profileRef = useRef(null);

	const { theme, themeName, toggleTheme } = useTheme();

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (profileRef.current && !profileRef.current.contains(e.target)) {
				setShowProfile(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div
			style={{
				height: "60px",
				background: theme.header,
				color: theme.text,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 20px",
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 5
			}}
		>
			{/* LEFT */}
			<div style={{ display: "flex", alignItems: "center" }}>
				<button
					onClick={onMenuClick}
					style={{
						fontSize: "22px",
						background: "transparent",
						border: "none",
						color: theme.text,
						cursor: "pointer",
						marginRight: "15px"
					}}
				>
					☰
				</button>
				<b>Student Borrowing Portal</b>
			</div>

			{/* RIGHT AVATAR */}
			<div ref={profileRef} style={{ position: "relative" }}>
				<div
					onClick={() => setShowProfile(!showProfile)}
					style={{
						width: "36px",
						height: "36px",
						borderRadius: "50%",
						background: theme.card,
						color: theme.header,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						fontWeight: "600"
					}}
				>
					S
				</div>

				{/* DROPDOWN */}
				{showProfile && (
					<div
						style={{
							position: "absolute",
							top: "48px",
							right: 0,
							width: "240px",
							background: theme.modal,
							color: theme.text,
							borderRadius: "6px",
							border: `1px solid ${theme.border}`,
							boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
							zIndex: 10
						}}
					>
						<div
							style={{
								padding: "12px 14px",
								borderBottom: `1px solid ${theme.border}`
							}}
						>
							<div style={{ fontWeight: "600" }}>Student Name</div>
							<div style={{ fontSize: "12px", opacity: 0.7 }}>
								student@email.com
							</div>
						</div>

						<div style={menuItemStyle}>Profile</div>
						<div style={menuItemStyle}>Borrowed Items</div>
						<div style={menuItemStyle}>Report Problem</div>

						<div
							onClick={toggleTheme}
							style={menuItemStyle}
						>
							Theme: {themeName === "dark" ? "Dark" : "Light"}
						</div>

						<div
							style={{
								...menuItemStyle,
								borderTop: `1px solid ${theme.border}`,
								color: "#c62828"
							}}
						>
							Logout
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

const menuItemStyle = {
	padding: "10px 14px",
	cursor: "pointer",
	fontSize: "14px",
	fontWeight: "500"
};