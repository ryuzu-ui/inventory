import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";
import Dashboard from "../components/admin/Dashboard";
import RoomCalendarPage from "./RoomCalendarPage";
import FAQManager from "../components/admin/FAQManager"
import { getItems } from "../helper/api";
import BorrowRequests from "../components/admin/BorrowRequests";
import ProblemReports from "../components/admin/ProblemReports";
import { useTheme } from "../context/ThemeContext";
import UserManager from "../components/admin/UserManager";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("dashboard");

  const { theme, setThemeScope } = useTheme();

  const [items, setItems] = useState([]);

  const reloadItems = async () => {
    try {
      const data = await getItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("getItems error:", e);
      setItems([]);
    }
  };

  useEffect(() => {
    document.title = "Admin | Inventory System";
  }, []);

  useEffect(() => {
    setThemeScope("admin");
  }, [setThemeScope]);

  useEffect(() => {
    reloadItems();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <Header onMenuClick={() => setSidebarOpen(true)} showThemeToggle />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setSidebarOpen(false);
        }}
      />

      <div style={{ padding: "20px", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
        {page === "dashboard" && <Dashboard items={items} setItems={setItems} />}

        {page === "inventory" && (
          <InventoryTable items={items} setItems={setItems} />
        )}

        {page === "calendar" && <RoomCalendarPage />}

        {page === "borrow_requests" && (
          <BorrowRequests onInventoryChanged={reloadItems} />
        )}

        {page === "problem_reports" && (
          <ProblemReports />
        )}

        {/* NEW FAQ PAGE */}
        {page === "faq" && (
          <>
            <h2 style={{ marginTop: 0 }}>FAQ Manager</h2>
            <FAQManager />
          </>
        )}

        {page === "users" && <UserManager />}
      </div>
    </div>
  );
}