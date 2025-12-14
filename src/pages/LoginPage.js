import { useState } from "react";
import { login } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleLogin = () => {
		const user = login(username, password);
		if (!user) {
			alert("Invalid login");
			return;
		}

		if (user.role === "admin") navigate("/admin");
		else navigate("/student");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0d47a1",
			}}
		>
			<div
				style={{
					background: "white",
					padding: "30px",
					borderRadius: "10px",
					width: "320px",
				}}
			>
				<h2 style={{ textAlign: "center" }}>Login</h2>

				<input
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					style={{ width: "100%", marginBottom: "10px" }}
				/>

				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					style={{ width: "100%", marginBottom: "15px" }}
				/>

				<button
					onClick={handleLogin}
					style={{
						width: "100%",
						padding: "10px",
						background: "#0d47a1",
						color: "white",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
					}}
				>
					Login
				</button>

				<div style={{ fontSize: "12px", marginTop: "15px" }}>
					<p>studentA / 1234</p>
					<p>studentB / 1234</p>
					<p>admin / admin123</p>
				</div>
			</div>
		</div>
	);
}
