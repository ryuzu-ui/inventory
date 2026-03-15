import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";
import Dashboard from "../components/admin/Dashboard";
import RoomCalendarPage from "./RoomCalendarPage";
import FAQManager from "../components/admin/FAQManager"
import { getItems } from "../helper/api";
import BorrowRequests from "../components/admin/BorrowRequests";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("dashboard");

  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = "Admin | Inventory System";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getItems();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("getItems error:", e);
        setItems([]);
      }
    })();
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

        {page === "inventory" && (
          <InventoryTable items={items} setItems={setItems} />
        )}

        {page === "calendar" && <RoomCalendarPage />}

        {page === "borrow_requests" && <BorrowRequests />}

        {/* NEW FAQ PAGE */}
        {page === "faq" && (
          <>
            <h2 style={{ marginTop: 0 }}>FAQ Manager</h2>
            <FAQManager />
          </>
        )}
      </div>
    </div>
  );
}