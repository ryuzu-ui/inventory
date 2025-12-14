import { useState } from "react";
import { login } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleLogin = () => {
		const user = login(username, password);
		if (!user) return alert("Invalid login");

		if (user.role === "admin") navigate("/admin");
		else navigate("/student");
	};

	return (
		<div style={{ maxWidth: "320px", margin: "120px auto" }}>
			<h2>Login</h2>

			<input
				placeholder="Username"
				value={username}
				onChange={e => setUsername(e.target.value)}
				style={{ width: "100%", marginBottom: "10px" }}
			/>

			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={e => setPassword(e.target.value)}
				style={{ width: "100%", marginBottom: "15px" }}
			/>

			<button onClick={handleLogin} style={{ width: "100%" }}>
				Login
			</button>

			<div style={{ marginTop: "15px", fontSize: "12px" }}>
				<p>studentA / 1234 (08–10)</p>
				<p>studentB / 1234 (11–13)</p>
				<p>admin / admin123</p>
			</div>
		</div>
	);
}
