import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function StudentHeader({ onMenuClick }) {
	const [showProfile, setShowProfile] = useState(false);
	const profileRef = useRef(null);
	const { theme, toggleTheme } = useTheme();

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
				background: "#0d47a1",
				color: "white",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 20px",
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 5,
				fontFamily: "inherit"
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
						color: "white",
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
						background: "#ffffff",
						color: "#0d47a1",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						fontWeight: "600",
						fontSize: "14px"
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
							background: "#fff",
							color: "#000",
							borderRadius: "6px",
							boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
							zIndex: 10,
							fontFamily: "inherit"
						}}
					>
						{/* USER INFO */}
						<div
							style={{
								padding: "12px 14px",
								borderBottom: "1px solid #eee"
							}}
						>
							<div style={{ fontWeight: "600" }}>
								Student Name
							</div>
							<div style={{ fontSize: "12px", color: "#666" }}>
								student@email.com
							</div>
						</div>

						<div style={menuItemStyle}>Profile</div>
						<div style={menuItemStyle}>Borrowed Items</div>
						<div style={menuItemStyle}>Report Problem</div>
						<div
							onClick={toggleTheme}
							style={{
								padding: "10px 14px",
								cursor: "pointer",
								fontSize: "14px",
								fontWeight: "500"
							}}
						>
							Theme: {theme === "dark" ? "Dark" : "Light"}
						</div>
						<div
							style={{
								...menuItemStyle,
								borderTop: "1px solid #eee",
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