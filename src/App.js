import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";
import RoomCalendarPage from "./pages/RoomCalendarPage"; // ✅ your import
import { getUser } from "./components/services/authService";

function ProtectedRoute({ children, role }) {
  const user = getUser();

  const userRole = String(user?.role || "").toLowerCase();
  const requiredRole = String(role || "").toLowerCase();

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Wrong role
  if (userRole !== requiredRole) {
    // send them somewhere sensible
    return <Navigate to={userRole === "admin" ? "/admin" : "/student"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* ✅ Student routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/calendar"
          element={
            <ProtectedRoute role="student">
              <RoomCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/calendar"
          element={
            <ProtectedRoute role="admin">
              <RoomCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}