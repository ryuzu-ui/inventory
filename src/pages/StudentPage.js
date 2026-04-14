import React, { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import RoomCalendarPage from "./RoomCalendarPage";
import { useTheme } from "../context/ThemeContext";
import ChatbotWidget from "../components/student/ChatbotWidget";
import { getUser } from "../components/services/authService";
import { getNotifications } from "../helper/api";
import { useNavigate } from "react-router-dom";

export default function StudentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [notification, setNotification] = useState("");
  const { theme, setThemeScope } = useTheme();

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    document.title = "Student | Inventory System";
  }, []);

  useEffect(() => {
    setThemeScope("student");
  }, [setThemeScope]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentActivity() {
      if (page !== "home") return;
      const user = getUser();
      if (!user?.id) {
        setRecentActivity([]);
        return;
      }

      setActivityLoading(true);
      try {
        const rows = await getNotifications({ userId: user.id, limit: 10 });
        if (!cancelled) setRecentActivity(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setRecentActivity([]);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }

    loadRecentActivity();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        position: "relative",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        touchAction: "pan-y"
      }}
    >
      <StudentHeader
        onMenuClick={toggleSidebar}
        onNavigate={(page) => {
          if (page === "home") navigate("/user/home");
        }}
      />

      <div style={{
        position: "fixed",
        top: "0",
        right: "20px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        zIndex: 1000,
      }}>
        <div style={{ position: "relative" }}>
        </div>
      </div>

      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setSidebarOpen(false);
        }}
      />

      <ChatbotWidget />

      {notification && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#1e293b",
          padding: "15px 20px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          zIndex: 1000
        }}>
          {notification}
        </div>
      )}

      <div style={{ padding: "30px", paddingTop: "90px", maxWidth: "100vw", overflowX: "hidden" }}>

        {page === "home" && (
          <div>
            <h2 style={{ marginBottom: "10px" }}>Welcome Student 👋</h2>
            <p style={{ opacity: 0.6, marginBottom: "30px" }}>
              View your borrowing information and manage your requests.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={cardStyle(theme)}><h3>Borrowed Items</h3></div>
              <div style={cardStyle(theme)}><h3>Pending Requests</h3></div>
              <div style={cardStyle(theme)}><h3>Overdue Items</h3></div>
              <div style={cardStyle(theme)}><h3>Borrow History</h3></div>
            </div>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "30px"
            }}>
              <button
                onClick={() => setPage("borrow")}
                style={primaryBtn}
              >
                Borrow Equipment
              </button>

              <button
                onClick={() => setPage("calendar")}
                style={secondaryBtn}
              >
                View Lab Schedule
              </button>
            </div>

            <div style={activityBox(theme)}>
              <h3 style={{ marginBottom: "15px" }}>Recent Activity</h3>
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {activityLoading ? (
                  <p style={{ opacity: 0.6 }}>Loading...</p>
                ) : recentActivity.length === 0 ? (
                  <p style={{ opacity: 0.5 }}>No recent activity available.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recentActivity.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "12px",
                          border: `1px solid ${theme.border}`,
                          background: a?.read ? "transparent" : "rgba(37,99,235,0.10)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                          <div style={{ fontWeight: 700, fontSize: "13px" }}>{a.title || "Notification"}</div>
                          <div style={{ fontSize: "11px", opacity: 0.7 }}>
                            {a.created_at ? String(a.created_at).replace("T", " ").slice(0, 16) : ""}
                          </div>
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.9 }}>
                          {a.body || a.message || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "borrow" && (
          <>
            <h2>Borrow Form</h2>
            <BorrowTable />
          </>
        )}

        {page === "calendar" && <RoomCalendarPage />}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const cardStyle = (theme) => ({
	background: theme.card,
	color: theme.text,
	padding: "25px",
	borderRadius: "16px",
	minHeight: "120px",
	display: "flex",
	alignItems: "center",
	boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
});

const primaryBtn = {
  padding: "12px 25px",
  background: "linear-gradient(90deg, #3b82f6, #2563eb)",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontWeight: "600"
};

/* 🔵 Now Blue */
const secondaryBtn = {
  padding: "12px 25px",
  background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontWeight: "600"
};

const activityBox = (theme) => ({
	background: theme.card,
	color: theme.text,
	padding: "20px",
	borderRadius: "16px",
	boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
});