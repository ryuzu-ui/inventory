import React, { useState } from "react";

export default function ChatbotWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ from: "bot", text: "How can I help you with requisition?" }
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	const sendMessage = async () => {
		if (!input.trim()) return;

		setMessages(prev => [...prev, { from: "user", text: input }]);
		setLoading(true);

		try {
			const response = await fetch("http://localhost:5000/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: input })
			});

			const data = await response.json();

			setMessages(prev => [
				...prev,
				{ from: "bot", text: data.reply }
			]);
		} catch (err) {
			setMessages(prev => [
				...prev,
				{ from: "bot", text: "Server not available." }
			]);
		}

		setLoading(false);
		setInput("");
	};

	return (
		<>
			<div
				onClick={() => setOpen(!open)}
				style={{
					position: "fixed",
					bottom: "20px",
					right: "20px",
					width: "60px",
					height: "60px",
					borderRadius: "50%",
					background: "#2563eb",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					fontSize: "28px",
					zIndex: 9999
				}}
			>
				💬
			</div>

			{open && (
				<div style={{
					position: "fixed",
					bottom: "90px",
					right: "20px",
					width: "320px",
					height: "420px",
					background: "#0f172a",
					color: "#fff",
					borderRadius: "14px",
					display: "flex",
					flexDirection: "column",
					zIndex: 9999
				}}>
					<div style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
						Requisition Assistant
					</div>

					<div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
						{messages.map((m, i) => (
							<div key={i} style={{ textAlign: m.from === "user" ? "right" : "left" }}>
								<span style={{
									display: "inline-block",
									padding: "8px 12px",
									borderRadius: "12px",
									background: m.from === "user" ? "#2563eb" : "#334155",
									marginBottom: "6px"
								}}>
									{m.text}
								</span>
							</div>
						))}
						{loading && <p style={{ opacity: 0.5 }}>Typing…</p>}
					</div>

					<div style={{ display: "flex", padding: "8px" }}>
						<input
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => e.key === "Enter" && sendMessage()}
							style={{ flex: 1, padding: "8px", borderRadius: "8px" }}
						/>
						<button onClick={sendMessage} style={{ marginLeft: "6px" }}>
							Send
						</button>
					</div>
				</div>
			)}
		</>
	);
}