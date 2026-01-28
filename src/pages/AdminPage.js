import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";
import Dashboard from "../components/admin/Dashboard";
import RoomCalendarPage from "./RoomCalendarPage";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("dashboard");

  // ✅ SINGLE SOURCE OF TRUTH
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("inventory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    document.title = "Admin | Inventory System";
  }, []);

  // ✅ sync kapag may ibang nag-edit ng localStorage
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("inventory");
      if (saved) setItems(JSON.parse(saved));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div style={{ height: "100vh", background: "white" }}>
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setSidebarOpen(false);
        }}
      />

      <div style={{ padding: "20px" }}>
        {page === "dashboard" && <Dashboard items={items} setItems={setItems} />}

        {page === "inventory" && <InventoryTable items={items} setItems={setItems} />}

        {/* ✅ Calendar page for Admin */}
        {page === "calendar" && (
          <>
            <h2 style={{ marginTop: 0 }}>Lab Room Calendar</h2>
            <RoomCalendarPage />
          </>
        )}
      </div>
    </div>
  );
}
