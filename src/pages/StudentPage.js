import { useState, useEffect } from "react";
import StudentHeader from "../components/layout/StudentHeader";
import StudentSidebar from "../components/layout/StudentSidebar";
import BorrowTable from "../components/student/BorrowTable";
import RoomCalendarPage from "./RoomCalendarPage";

export default function StudentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [notification, setNotification] = useState("");

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
    <div style={{ minHeight: "100vh", background: "#111", color: "white", position: "relative" }}>
      <StudentHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* SIDEBAR */}
      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setSidebarOpen(false);
        }}
      />

      {notification && (
        <div style={{
          position: "fixed", top: "20px", right: "20px",
          backgroundColor: "#333", color: "white", padding: "15px 20px",
          borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.3)", zIndex: 1000
        }}>
          {notification}
        </div>
      )}

      <div style={{ padding: "20px", paddingTop: "80px" }}>
        {page === "home" && (
          <div style={{ background: "#1e1e1e", padding: "25px", borderRadius: "12px" }}>
            <h2>Welcome Student 👋</h2>
            <p>Use the sidebar to borrow equipment or check your lab schedule.</p>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setNotification("📩 Schedule Approved")}
                style={{
                  marginRight: "10px", padding: "10px 20px", backgroundColor: "green",
                  color: "white", border: "none", borderRadius: "5px", cursor: "pointer"
                }}
              >
                Approve
              </button>

              <button
                onClick={() => setNotification("📁 Schedule Rejected")}
                style={{
                  padding: "10px 20px", backgroundColor: "red",
                  color: "white", border: "none", borderRadius: "5px", cursor: "pointer"
                }}
              >
                Reject
              </button>
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
