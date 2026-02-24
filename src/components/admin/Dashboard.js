import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

import {
  getAdminStats,
  getAdminRoomReservations,
  updateReservationStatus,
} from "../../helper/api";

/* ✅ BLACK TOOLTIP */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          color: "black",
        }}
      >
        <p style={{ margin: 0 }}>{label}</p>
        <p style={{ margin: 0 }}>
          value: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    setLoading(true);
    setMessage("");
    try {
      const s = await getAdminStats();
      setStats(s?.reservations || null);

      const list = await getAdminRoomReservations({ status: "pending" });
      setReservations(list);
    } catch (e) {
      setMessage(e.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const total = stats?.total ?? 0;
  const pending = stats?.pending ?? 0;
  const approved = stats?.approved ?? 0;
  const cancelled = stats?.cancelled ?? 0;

  const statusData = useMemo(
    () => [
      { name: "Pending", value: pending },
      { name: "Approved", value: approved },
      { name: "Cancelled", value: cancelled },
    ],
    [pending, approved, cancelled]
  );

  const roomsData = useMemo(() => {
    const map = {};
    reservations.forEach((r) => {
      const key = r.room_name || `Room ${r.lab_room_id}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [reservations]);

  const handleSetStatus = async (id, status) => {
    try {
      setMessage("");
      await updateReservationStatus({ id, status });
      setMessage(`Reservation ${status}.`);
      await refresh();
    } catch (e) {
      setMessage(e.message || "Failed to update status.");
    }
  };

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return "#facc15";
      case "approved":
        return "#2563eb";
      case "cancelled":
      case "rejected":
        return "#dc2626";
      default:
        return "#000";
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Inventory Dashboard</h2>
        <button
          onClick={refresh}
          style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      {loading && <div style={{ marginTop: 10 }}>Loading…</div>}
      {message && (
        <div style={{ marginTop: 10 }}>{message}</div>
      )}

      {/* KPI CARDS */}
      <div style={styles.grid}>
        <Card title="Total Reservations" value={total} />
        <Card title="Pending" value={pending} color="#facc15" />
        <Card title="Approved" value={approved} color="#2563eb" />
        <Card title="Cancelled" value={cancelled} color="#dc2626" />
      </div>

      {/* CHARTS */}
      <div style={{ ...styles.grid, marginTop: 20 }}>
        <ChartCard title="Reservation Status">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getStatusColor(entry.name)}
                  />
                ))}
                <LabelList dataKey="value" position="top" fill="black" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pending Requests by Room">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={roomsData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#facc15">
                <LabelList dataKey="value" position="top" fill="black" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {roomsData.length === 0 && (
            <div style={{ marginTop: 10 }}>No pending requests.</div>
          )}
        </ChartCard>
      </div>

      {/* TABLE */}
      <h3 style={{ marginTop: 30 }}>Pending Room Reservations</h3>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Requested By</th>
            <th>Room</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {reservations.length === 0 ? (
            <tr>
              <td colSpan="6" align="center">
                No pending reservations
              </td>
            </tr>
          ) : (
            reservations.map((r) => (
              <tr key={r.id}>
                <td>{r.reserved_by_name || `User #${r.reserved_by}`}</td>

                <td style={{ color: "black" }}>
                  {r.room_name}
                </td>

                <td>{String(r.reservation_date).slice(0, 10)}</td>

                <td>
                  {String(r.start_time).slice(0, 5)} –{" "}
                  {String(r.end_time).slice(0, 5)}
                </td>

                <td style={{ color: "black" }}>
                  {r.status}
                </td>

                <td>
                  {String(r.status).toLowerCase() === "pending" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleSetStatus(r.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSetStatus(r.id, "cancelled")}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      style={{
        ...styles.card,
        borderLeft: color ? `6px solid ${color}` : "",
      }}
    >
      <h4>{title}</h4>
      <h2 style={{ color: color || "#000" }}>{value}</h2>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ ...styles.card, height: 320 }}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
};