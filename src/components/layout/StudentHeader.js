import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getUser, logout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
    getBorrowRequests,
    getBorrowRequestItems,
    submitProblemReport,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    openNotificationsStream,
} from "../../helper/api";

export default function StudentHeader({ onMenuClick }) {

    const [showProfile, setShowProfile] = useState(false);
    const [activePanel, setActivePanel] = useState(null);
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.innerWidth <= 768 : false
	);

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState("");

    const [borrowRequests, setBorrowRequests] = useState([]);
    const [borrowLoading, setBorrowLoading] = useState(false);
    const [borrowError, setBorrowError] = useState("");

    const [reportMessage, setReportMessage] = useState("");
    const [reportLoading, setReportLoading] = useState(false);

    const user = getUser();

    const toast = useToast();

    const navigate = useNavigate();

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const { theme, themeName, toggleTheme } = useTheme();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

    const unreadCount = useMemo(() => {
        return (notifications || []).filter((n) => !n?.read).length;
    }, [notifications]);

    const loadNotifications = useCallback(async () => {
        if (!user?.id) {
            setNotifications([]);
            setNotifError("Not logged in.");
            return;
        }

        setNotifLoading(true);
        setNotifError("");
        try {
            const rows = await getNotifications({ userId: user.id, limit: 30 });
            setNotifications(Array.isArray(rows) ? rows : []);
        } catch (e) {
            setNotifications([]);
            setNotifError(e?.message || "Failed to load notifications");
        } finally {
            setNotifLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        // initial load (once per login)
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        // live stream
        if (!user?.id) return;

        const es = openNotificationsStream({ userId: user.id });

        es.onmessage = (evt) => {
            try {
                const payload = JSON.parse(evt?.data || "{}");
                if (!payload || payload.ping || payload.ok) return;
                // prepend new notif
                setNotifications((prev) => {
                    const arr = Array.isArray(prev) ? prev : [];
                    // de-dupe by id
                    if (arr.some((x) => x?.id === payload.id)) return arr;
                    return [payload, ...arr].slice(0, 30);
                });
                toast.push({
                    type: payload.type === "success" ? "success" : "info",
                    title: payload.title || "Notification",
                    description: payload.body || "",
                    durationMs: 2500,
                });
            } catch {
                // ignore
            }
        };

        es.onerror = () => {
            try {
                es.close();
            } catch {
                // ignore
            }
        };

        return () => {
            try {
                es.close();
            } catch {
                // ignore
            }
        };
    }, [toast, user?.id]);

    useEffect(() => {
        let cancelled = false;

        async function loadBorrowed() {
            if (activePanel !== "borrowed") return;
            if (!user?.id) {
                setBorrowRequests([]);
                setBorrowError("Not logged in.");
                return;
            }

            setBorrowLoading(true);
            setBorrowError("");
            try {
                const requests = await getBorrowRequests({ student_id: user.id });
                const enriched = await Promise.all(
                    requests.map(async (r) => {
                        try {
                            const items = await getBorrowRequestItems(r.id);
                            return { ...r, items };
                        } catch {
                            return { ...r, items: [] };
                        }
                    })
                );

                if (cancelled) return;
                setBorrowRequests(enriched);
            } catch (e) {
                if (cancelled) return;
                setBorrowRequests([]);
                setBorrowError(e?.message || "Failed to load borrow history");
            } finally {
                if (!cancelled) setBorrowLoading(false);
            }
        }

        loadBorrowed();
        return () => {
            cancelled = true;
        };
    }, [activePanel, user?.id]);

    const openPanel = (panel) => {
        setActivePanel(panel);
        setShowProfile(false);
        setNotifOpen(false);
    };

    const closePanel = () => {
        setActivePanel(null);
    };

    const handleToggleNotif = async () => {
        const next = !notifOpen;
        setNotifOpen(next);
        setShowProfile(false);

        if (next) {
            await loadNotifications();
        }
    };

    const handleNotifClick = async (n) => {
        if (!n?.id) return;
        if (!n?.read) {
            try {
                await markNotificationRead(n.id);
                setNotifications((prev) =>
                    (Array.isArray(prev) ? prev : []).map((x) => (x?.id === n.id ? { ...x, read: true } : x))
                );
            } catch {
                // ignore
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        try {
            await markAllNotificationsRead({ userId: user.id });
            setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((x) => ({ ...x, read: true })));
        } catch (e) {
            toast.push({
                type: "error",
                title: "Failed",
                description: e?.message || "Failed to mark all as read",
            });
        }
    };

    const handleReportSubmit = async () => {
        const msg = String(reportMessage || "").trim();
        if (!user?.id) {
            toast.push({ type: "error", title: "Not logged in", description: "Please log in again." });
            return;
        }
        if (!msg) {
            toast.push({ type: "warning", title: "Missing message", description: "Please describe the problem." });
            return;
        }

        setReportLoading(true);
        try {
            await submitProblemReport({ student_id: user.id, message: msg });
            setReportMessage("");
            toast.push({ type: "success", title: "Report submitted", description: "Your report was sent to the admins." });
            setActivePanel(null);
        } catch (e) {
            toast.push({ type: "error", title: "Submit failed", description: e?.message || "Failed to submit report" });
        } finally {
            setReportLoading(false);
        }
    };

    // Theme-based colors
    const avatarBg = themeName === "dark" ? "#444" : "#ddd";
    const labelColor = themeName === "dark" ? "#aaa" : "#555";
    const fieldBg = themeName === "dark" ? "#333" : "#f5f5f5";
    const textareaBg = themeName === "dark" ? "#444" : "#fff";
    const buttonBg = themeName === "dark" ? "#1976d2" : "#1976d2";

    return (
        <>
            {/* HEADER */}
            <div
                style={{
                    height: "60px",
                    background: theme.header,
                    color: theme.headerText,
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
                            color: theme.headerText,
                            cursor: "pointer",
                            marginRight: "15px"
                        }}
                    >
                        ☰
                    </button>
                    <b style={{ color: theme.headerText }}>Student Borrowing Portal</b>
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                    {/* NOTIFICATIONS */}
                    <div ref={notifRef} style={{ position: "relative" }}>
                        <button
                            onClick={handleToggleNotif}
                            aria-label="Notifications"
                            style={{
                                position: "relative",
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                border: `1px solid ${theme.border}`,
                                background: "transparent",
                                color: theme.headerText,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ display: "block" }}
                                aria-hidden="true"
                            >
                                <path
                                    d="M12 3v10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.5 11.5 12 14.9l3.5-3.4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M4 14l3.2-6.2A2 2 0 0 1 9 6.7h6a2 2 0 0 1 1.8 1.1L20 14"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {unreadCount > 0 ? (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-4px",
                                        minWidth: "18px",
                                        height: "18px",
                                        padding: "0 5px",
                                        borderRadius: "999px",
                                        background: "#dc2626",
                                        color: "#fff",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        border: `2px solid ${theme.header}`,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            ) : null}
                        </button>

                        {notifOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "48px",
                                    right: 0,
                                    width: isMobile ? "85vw" : "340px",
                                    maxWidth: "360px",
                                    background: theme.modal,
                                    color: theme.text,
                                    borderRadius: "10px",
                                    border: `1px solid ${theme.border}`,
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                                    zIndex: 20,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "10px",
                                        borderBottom: `1px solid ${theme.border}`,
                                    }}
                                >
                                    <div style={{ fontWeight: 700 }}>Notifications</div>
                                    <button
                                        onClick={handleMarkAllRead}
                                        disabled={unreadCount === 0}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: unreadCount === 0 ? "rgba(255,255,255,0.4)" : "#2563eb",
                                            cursor: unreadCount === 0 ? "default" : "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Mark all read
                                    </button>
                                </div>

                                <div style={{ maxHeight: isMobile ? "55vh" : "380px", overflowY: "auto" }}>
                                    {notifLoading ? (
                                        <div style={{ padding: "12px", color: themeName === "dark" ? "#aaa" : "#555" }}>
                                            Loading...
                                        </div>
                                    ) : notifError ? (
                                        <div style={{ padding: "12px", color: "#c62828" }}>{notifError}</div>
                                    ) : (notifications || []).length === 0 ? (
                                        <div style={{ padding: "12px", color: themeName === "dark" ? "#aaa" : "#555" }}>
                                            No notifications yet.
                                        </div>
                                    ) : (
                                        (notifications || []).map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotifClick(n)}
                                                style={{
                                                    padding: "10px 12px",
                                                    cursor: "pointer",
                                                    background: n.read
                                                        ? "transparent"
                                                        : themeName === "dark"
                                                        ? "rgba(37,99,235,0.16)"
                                                        : "rgba(37,99,235,0.10)",
                                                    borderBottom: `1px solid ${theme.border}`,
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                                    <div style={{ fontWeight: 700, fontSize: "13px" }}>
                                                        {n.title || "Notification"}
                                                    </div>
                                                    <div style={{ fontSize: "11px", opacity: 0.7 }}>
                                                        {n.created_at ? String(n.created_at).replace("T", " ").slice(0, 16) : ""}
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.9 }}>
                                                    {n.body}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
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
                        <div style={{ fontWeight: "600", fontSize: "15px", color: theme.text, textAlign: "center" }}>
                            Borrowed Items History
                        </div>

                        {borrowLoading && (
                            <div style={{ color: labelColor, textAlign: "center" }}>Loading...</div>
                        )}

                        {!borrowLoading && borrowError && (
                            <div style={{ color: "#c62828", textAlign: "center" }}>{borrowError}</div>
                        )}

                        {!borrowLoading && !borrowError && borrowRequests.length === 0 && (
                            <div style={{ color: labelColor, textAlign: "center" }}>No borrowed items yet.</div>
                        )}

                        {!borrowLoading && !borrowError && borrowRequests.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {borrowRequests.map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: "10px",
                                            padding: "10px",
                                            background: themeName === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                            <div style={{ fontWeight: "600" }}>#{r.id}</div>
                                            <div style={{ color: labelColor, textTransform: "capitalize" }}>{r.status}</div>
                                        </div>
                                        <div style={{ fontSize: "12px", color: labelColor, marginTop: "2px" }}>
                                            Borrow: {r.borrow_date ? String(r.borrow_date).slice(0, 10) : "—"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: labelColor }}>
                                            Return: {String(r.status || "").toLowerCase() === "returned"
                                                ? String(r.returned_at || "").slice(0, 10)
                                                : "—"}
                                        </div>

                                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {(r.items || []).length === 0 ? (
                                                <div style={{ fontSize: "12px", color: labelColor }}>No items found.</div>
                                            ) : (
                                                (r.items || []).map((it) => (
                                                    <div key={`${r.id}-${it.item_id}`} style={{ fontSize: "13px" }}>
                                                        <div style={{ fontWeight: "600" }}>{it.item_name}</div>
                                                        <div style={{ fontSize: "12px", color: labelColor }}>
                                                            Qty: {it.quantity}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                            style={{
                                width: "100%",
                                minHeight: "80px",
                                padding: "10px",
                                borderRadius: "6px",
                                border: `1px solid ${theme.border}`,
                                background: textareaBg,
                                color: theme.text,
                                fontSize: isMobile ? "16px" : "14px",
                                resize: "vertical",
                                boxSizing: "border-box"
                            }}
                        />

                        <button
                            onClick={handleReportSubmit}
                            disabled={reportLoading}
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
                            {reportLoading ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// STYLES
const menuItemStyle = { padding: "10px 14px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };
