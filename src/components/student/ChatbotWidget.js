import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ChatbotWidget() {

	const CHATBOT_BASE = process.env.REACT_APP_CHATBOT_BASE_URL || "http://localhost:5001";

	const { themeName } = useTheme();
	const isDark = themeName === "dark";

	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ from: "bot", text: "Hi! I'm your requisition assistant. How can I help?" }
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
	const [position, setPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 90 });

	const dragging = useRef(false);

	useEffect(() => {
		const onResize = () => {
			const nextIsMobile = window.innerWidth <= 768;
			setIsMobile(nextIsMobile);
			if (!nextIsMobile) {
				setPosition((p) => {
					const bubbleSize = 64;
					const margin = 10;
					const maxX = Math.max(margin, window.innerWidth - bubbleSize - margin);
					const maxY = Math.max(margin, window.innerHeight - bubbleSize - margin);
					return {
						x: Math.min(Math.max(p.x, margin), maxX),
						y: Math.min(Math.max(p.y, margin), maxY)
					};
				});
			}
		};

		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const sendMessage = async () => {

		if (!input.trim()) return;

		setMessages(prev => [...prev, { from: "user", text: input }]);
		setLoading(true);

		try {

			const response = await fetch(`${CHATBOT_BASE}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: input })
			});

			const data = await response.json();

			setMessages(prev => [
				...prev,
				{ from: "bot", text: data.reply }
			]);

		} catch {

			setMessages(prev => [
				...prev,
				{ from: "bot", text: "Server not available." }
			]);

		}

		setLoading(false);
		setInput("");
	};

	const handleMouseDown = () => {
		if (isMobile) return;
		dragging.current = true;
	};

	const handleMouseMove = (e) => {
		if (isMobile) return;
		if (!dragging.current) return;

		setPosition({
			x: e.clientX - 30,
			y: e.clientY - 30
		});
	};

	const handleMouseUp = () => {
		if (isMobile) return;

		dragging.current = false;

		if (position.x < window.innerWidth / 2) {
			setPosition(p => ({ ...p, x: 10 }));
		} else {
			setPosition(p => ({ ...p, x: window.innerWidth - 70 }));
		}
	};

	// ===== THEME VARIABLES =====
	const windowBg       = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
	const windowBorder   = isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.12)";
	const windowShadow   = isDark ? "0 25px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)" : "0 25px 70px rgba(0,0,0,0.2)";
	const headerBg       = isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa";
	const headerBorder   = isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)";
	const titleColor     = isDark ? "#ffffff" : "#000000";
	const backBtnBg      = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
	const backBtnBorder  = isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.12)";
	const backArrowColor = isDark ? "white" : "black";
	const msgAreaBg      = isDark ? "transparent" : "#ffffff";
	const botBubbleBg    = isDark ? "rgba(255,255,255,0.12)" : "#f0f0f0";
	const botTextColor   = isDark ? "white" : "#000000";
	const loadingColor   = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
	const inputAreaBg    = isDark ? "rgba(255,255,255,0.04)" : "#f8f9fa";
	const inputAreaBorder= isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)";
	const inputBg        = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
	const inputBorder    = isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.15)";
	const inputColor     = isDark ? "white" : "#000000";

	return (
		<div onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

			{/* Floating Bubble */}
			<div
				onClick={() => setOpen(!open)}
				onMouseDown={handleMouseDown}
				style={{
					position: "fixed",
					left: isMobile ? "auto" : position.x,
					top: isMobile ? "auto" : position.y,
					right: isMobile ? "calc(16px + env(safe-area-inset-right))" : "auto",
					bottom: isMobile ? "calc(16px + env(safe-area-inset-bottom))" : "auto",
					width: "64px",
					height: "64px",
					borderRadius: "50%",
					background: "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(59,130,246,0.9))",
					backdropFilter: "blur(25px)",
					WebkitBackdropFilter: "blur(25px)",
					border: "1px solid rgba(255,255,255,0.25)",
					boxShadow: "0 10px 35px rgba(0,0,0,0.4), 0 0 25px rgba(59,130,246,0.7)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: isMobile ? "pointer" : "grab",
					zIndex: 9999
				}}
			>
				<svg width="28" height="28" viewBox="0 0 24 24" fill="white">
					<path d="M12 2a3 3 0 013 3v1h1a3 3 0 013 3v3a3 3 0 01-3 3h-1v1a3 3 0 01-3 3 3 3 0 01-3-3v-1H8a3 3 0 01-3-3V9a3 3 0 013-3h1V5a3 3 0 013-3z"/>
				</svg>
			</div>

			{/* Chat Window */}
			{open && (
				<div style={{
					position: "fixed",
					right: "20px",
					bottom: "100px",
					width: "min(360px, 92vw)",
					height: "min(480px, 70vh)",
					maxHeight: "70vh",
					background: windowBg,
					backdropFilter: isDark ? "blur(40px)" : "none",
					WebkitBackdropFilter: isDark ? "blur(40px)" : "none",
					borderRadius: "26px",
					border: windowBorder,
					boxShadow: windowShadow,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					zIndex: 9999
				}}>

					{/* Header */}
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: "10px",
						padding: "16px",
						borderBottom: headerBorder,
						background: headerBg,
						backdropFilter: isDark ? "blur(20px)" : "none"
					}}>

						{/* Back Button */}
						<button
							onClick={() => setOpen(false)}
							style={{
								background: backBtnBg,
								border: backBtnBorder,
								borderRadius: "10px",
								width: "34px",
								height: "34px",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center"
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill={backArrowColor}>
								<path d="M15 18l-6-6 6-6"/>
							</svg>
						</button>

						<div style={{
							fontWeight: 600,
							fontSize: "15px",
							color: titleColor
						}}>
							AI Assistant
						</div>
					</div>

					{/* Messages */}
					<div style={{
						flex: 1,
						padding: "16px",
						overflowY: "auto",
						background: msgAreaBg
					}}>
						{messages.map((m, i) => (
							<div
								key={i}
								style={{
									textAlign: m.from === "user" ? "right" : "left",
									marginBottom: "12px"
								}}
							>
								<span style={{
									display: "inline-block",
									padding: "10px 16px",
									borderRadius: "18px",
									background:
										m.from === "user"
											? "linear-gradient(135deg,#6366f1,#3b82f6)"
											: botBubbleBg,
									backdropFilter: isDark ? "blur(10px)" : "none",
									color: m.from === "user" ? "#ffffff" : botTextColor,
									fontSize: "14px",
									maxWidth: "75%"
								}}>
									{m.text}
								</span>
							</div>
						))}

						{loading && (
							<div style={{ color: loadingColor }}>
								Typing...
							</div>
						)}
					</div>

					{/* Input */}
					<div style={{
						display: "flex",
						padding: "12px",
						borderTop: inputAreaBorder,
						background: inputAreaBg
					}}>
						<input
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => e.key === "Enter" && sendMessage()}
							placeholder="Ask something..."
							style={{
								flex: 1,
								padding: "10px 14px",
								borderRadius: "14px",
								border: inputBorder,
								background: inputBg,
								backdropFilter: isDark ? "blur(10px)" : "none",
								color: inputColor,
								outline: "none",
								fontSize: "14px"
							}}
						/>

						<button
							onClick={sendMessage}
							style={{
								marginLeft: "8px",
								width: "44px",
								borderRadius: "12px",
								border: isDark ? "1px solid rgba(255,255,255,0.2)" : "none",
								background: "linear-gradient(135deg,#6366f1,#3b82f6)",
								cursor: "pointer"
							}}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="white">
								<path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
							</svg>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
