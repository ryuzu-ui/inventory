import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getUser, logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function StudentHeader({ onMenuClick }) {
    const [showProfile, setShowProfile] = useState(false);
    const [activePanel, setActivePanel] = useState(null);

    const user = getUser();

    const navigate = useNavigate();

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

    const openPanel = (panel) => {
        setActivePanel(panel);
        setShowProfile(false);
    };

    const closePanel = () => {
        setActivePanel(null);
    };

    // Theme-based colors
    const avatarBg = themeName === "dark" ? "#444" : "#ddd";
    const labelColor = themeName === "dark" ? "#aaa" : "#555";
    const fieldBg = themeName === "dark" ? "#333" : "#f5f5f5";
    const textareaBg = themeName === "dark" ? "#444" : "#fff";
    const buttonBg = themeName === "dark" ? "#1976d2" : "#1976d2"; // same color, works in both

    return (
        <>
            {/* HEADER */}
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

                {/* AVATAR */}
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

                    {/* DROPDOWN MENU */}
                    {showProfile && (
                        <div
                            style={{
                                position: "absolute",
                                top: "48px",
                                right: 0,
                                width: "200px",
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
                                    borderBottom: `1px solid ${theme.border}`,
                                    fontWeight: "600"
                                }}
                            >
                                Student
                            </div>

                            <div style={menuItemStyle} onClick={() => openPanel("profile")}>
                                Profile
                            </div>
                            <div style={menuItemStyle} onClick={() => openPanel("borrowed")}>
                                Borrowed Items
                            </div>
                            <div style={menuItemStyle} onClick={() => openPanel("report")}>
                                Report Problem
                            </div>
                            <div style={menuItemStyle} onClick={toggleTheme}>
                                Theme: {themeName === "dark" ? "Dark" : "Light"}
                            </div>
                            <div
                                style={{
                                    ...menuItemStyle,
                                    borderTop: `1px solid ${theme.border}`,
                                    color: "#c62828"
                                }}
                                onClick={() => {
                                    logout();
                                    setShowProfile(false);
                                    setActivePanel(null);
                                    navigate("/");
                                }}
                            >
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SLIDE PANEL */}
            <div
                style={{
                    position: "fixed",
                    top: "70px",
                    right: activePanel ? "20px" : "-400px",
                    width: "280px",
                    maxHeight: "80vh",
                    background: theme.card,
                    color: theme.text,
                    boxShadow: "-4px 0 12px rgba(0,0,0,0.25)",
                    transition: "right 0.35s ease",
                    zIndex: 20,
                    padding: "18px",
                    borderRadius: "12px",
                    overflowY: "auto",
                    display: activePanel ? "block" : "none"
                }}
            >
                {/* CLOSE BUTTON */}
                <div style={{ textAlign: "right" }}>
                    <button
                        onClick={closePanel}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "20px",
                            cursor: "pointer",
                            color: theme.text,
                            lineHeight: "1"
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* PROFILE PANEL */}
                {activePanel === "profile" && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <div
                                style={{
                                    width: "45px",
                                    height: "45px",
                                    borderRadius: "50%",
                                    background: avatarBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "600",
                                    fontSize: "18px",
                                    color: themeName === "dark" ? "#fff" : "#333"
                                }}
                            >
                                S
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontWeight: "600", fontSize: "15px", color: theme.text }}>{user?.full_name || "Student"}</div>
                                <div style={{ fontSize: "12px", color: labelColor }}>Full Name</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div>
                                <span style={{ fontSize: "11px", color: labelColor }}>Email</span>
                                <input
                                    type="text"
                                    placeholder=""
                                    disabled
                                    value={user?.email || ""}
                                    style={{
                                        width: "100%",
                                        height: "22px",
                                        borderRadius: "4px",
                                        background: fieldBg,
                                        cursor: "default",
                                        marginTop: "2px",
                                        color: theme.text
                                    }}
                                />
                            </div>
                            <div>
                                <span style={{ fontSize: "11px", color: labelColor }}>ID Number</span>
                                <input
                                    type="text"
                                    placeholder=""
                                    disabled
                                    value={user?.school_id || ""}
                                    style={{
                                        width: "100%",
                                        height: "22px",
                                        borderRadius: "4px",
                                        background: fieldBg,
                                        cursor: "default",
                                        marginTop: "2px",
                                        color: theme.text
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* BORROWED ITEMS PANEL */}
                {activePanel === "borrowed" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                        <div style={{ color: labelColor, textAlign: "center" }}>
                            No borrowed items yet.
                        </div>
                    </div>
                )}

                {/* REPORT PROBLEM PANEL */}
                {activePanel === "report" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                        <div style={{ fontWeight: "600", fontSize: "15px", color: theme.text }}>
                            Report a Problem
                        </div>

                        <textarea
                            placeholder="Describe the problem..."
                            style={{
                                width: "100%",
                                minHeight: "80px",
                                padding: "10px",
                                borderRadius: "6px",
                                border: `1px solid ${theme.border}`,
                                background: textareaBg,
                                color: theme.text,
                                fontSize: "14px",
                                resize: "vertical",
                                boxSizing: "border-box"
                            }}
                        />

                        <button
                            style={{
                                padding: "9px 14px",
                                background: buttonBg,
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                width: "100%"
                            }}
                        >
                            Submit
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// STYLES
const menuItemStyle = { padding: "10px 14px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };