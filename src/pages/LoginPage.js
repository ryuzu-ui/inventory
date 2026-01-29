import { useState } from "react";
import { login } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
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

	const handleSignUp = () => {
		// Add your sign-up logic here
		alert("Sign up functionality - implement your registration logic");
	};

	const handleSubmit = () => {
		if (isSignUp) {
			handleSignUp();
		} else {
			handleLogin();
		}
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
				<h2 style={{ textAlign: "center" }}>
					{isSignUp ? "Sign Up" : "Login"}
				</h2>
				<input
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					style={{ width: "100%", marginBottom: "15px", padding: "8px" }}
				/>
				<button
					onClick={handleSubmit}
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
					{isSignUp ? "Sign Up" : "Login"}
				</button>
				
				<div style={{ textAlign: "center", marginTop: "15px" }}>
					<span style={{ fontSize: "14px", color: "#666" }}>
						{isSignUp ? "Already have an account? " : "Don't have an account? "}
					</span>
					<button
						onClick={() => setIsSignUp(!isSignUp)}
						style={{
							background: "none",
							border: "none",
							color: "#0d47a1",
							cursor: "pointer",
							textDecoration: "underline",
							fontSize: "14px",
						}}
					>
						{isSignUp ? "Login" : "Sign Up"}
					</button>
				</div>

				{!isSignUp && (
					<div style={{ fontSize: "12px", marginTop: "15px", color: "#666" }}>
						<p style={{ margin: "5px 0" }}>Test accounts:</p>
						<p style={{ margin: "5px 0" }}>studentA / 1234</p>
						<p style={{ margin: "5px 0" }}>studentB / 1234</p>
						<p style={{ margin: "5px 0" }}>admin / admin123</p>
					</div>
				)}
			</div>
		</div>
	);
}