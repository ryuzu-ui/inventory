import React, { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import RoomCalendarPage from "./RoomCalendarPage";
import { useTheme } from "../context/ThemeContext";
import { themes } from "../theme/studentTheme";
import ChatbotWidget from "../components/student/ChatbotWidget";


import { ThemeProvider } from "../context/ThemeContext";

export default function StudentRoot() {
	return (
		<ThemeProvider>
			<StudentPage />
		</ThemeProvider>
	);
}

function StudentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [notification, setNotification] = useState("");
  const { theme } = useTheme();
    const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    document.title = "Student | Inventory System";
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div
    style={{
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      position: "relative"
    }}
  >      
  
  <StudentHeader onMenuClick={() => setSidebarOpen(true)} />

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

          {showInbox && (
            <div style={{
              position: "absolute",
              top: "100%",
              right: 0,
              background: "#1e293b",
              borderRadius: "12px",
              width: "300px",
              maxHeight: "400px",
              overflowY: "auto",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              marginTop: "10px",
            }}>
              <div style={{
                padding: "15px",
                borderBottom: "1px solid #334155",
                fontWeight: "600"
              }}>
                Announcements
              </div>
              <div style={{ padding: "10px", color: "#cbd5e1" }}>
                <p>No new announcements.</p>
              </div>
            </div>
          )}
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

      <div style={{ padding: "30px", paddingTop: "90px" }}>

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
                <p style={{ opacity: 0.5 }}>
                  No recent activity available.
                </p>
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