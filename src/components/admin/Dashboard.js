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
  Line,
  LineChart
} from "recharts";
import {
  getAdminStats,
  getAdminRoomReservations,
  updateReservationStatus,
  getEvents,
  getLabRooms,
  getRoomReservationsByDate,
  createReservation,
} from "../../helper/api";

import { getUser } from "../services/authService";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

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
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [calendarReservations, setCalendarReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD
  const [dayReservations, setDayReservations] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [panelMessage, setPanelMessage] = useState("");

  const calendarEvents = useMemo(() => {
    return calendarReservations.map((e) => ({
      title: e.title,
      date: String(e.start).slice(0, 10),
    }));
  }, [calendarReservations]);

  const loadCalendarEvents = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      const data = await getEvents({ start, end });
      setCalendarReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      setCalendarReservations([]);
    }
  };

  // format Date -> YYYY-MM-DD (local)
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLabRooms();
        setRooms(Array.isArray(data) ? data : []);

        if (Array.isArray(data) && data.length && selectedRoomId === null) {
          setSelectedRoomId(data[0].id);
        }
      } catch (e) {
        setRooms([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDayReservations = async (roomId, dateStr) => {
    if (!roomId || !dateStr) return;
    setLoadingDay(true);
    setPanelMessage("");
    try {
      const data = await getRoomReservationsByDate({ roomId, date: dateStr });
      setDayReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      setDayReservations([]);
      setPanelMessage(e.message || "Failed to load reservations.");
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    if (panelOpen && selectedRoomId && selectedDate) {
      loadDayReservations(selectedRoomId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  const refresh = async () => {
    setLoading(true);
    setMessage("");
    try {
      const s = await getAdminStats();
      setStats(s?.reservations || null);

      const list = await getAdminRoomReservations();
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

    reservations
      .filter((r) => String(r.status).toLowerCase() === "pending")
      .forEach((r) => {
        const key = r.room_name || `Room ${r.lab_room_id}`;
        map[key] = (map[key] || 0) + 1;
      });

    const result = Object.entries(map).map(([name, value]) => ({ name, value }));

    if (result.length === 0) {
      return [{ name: "No Data", value: 0 }];
    }

    return result;
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
    <div style={styles.dashboard}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Dashboard User</h2>
        <button onClick={refresh} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={styles.topCards}>
        <Card title="Total Reservations" value={total} />
        <Card title="Pending" value={pending} color="#facc15" />
        <Card title="Approved" value={approved} color="#2563eb" />
        <Card title="Cancelled" value={cancelled} color="#dc2626" />
      </div>

      {/* CHARTS */}
      <div style={styles.chartGrid}>
        <ChartCard title="Reservation Status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={getStatusColor(entry.name)} />
                ))}
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ProgressWidget />

        <ChartCard title="Pending Requests by Room">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roomsData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <MiniCalendar
          events={calendarEvents}
          onDateClick={(dateStr) => {
            setSelectedDate(dateStr);
            setPanelOpen(true);
            setPanelMessage("");
            if (selectedRoomId) loadDayReservations(selectedRoomId, dateStr);
          }}
        />
      </div>

      {/* TABLE */}
      <div style={{ marginTop: "30px" }}>
        <h3>Pending Room Reservations</h3>
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Requested By</th>
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
                  <tr key={r.id} style={styles.row}>
                    <td>{r.reserved_by_name || `User #${r.reserved_by}`}</td>
                    <td>{r.room_name}</td>
                    <td>{String(r.reservation_date).slice(0, 10)}</td>
                    <td>
                      {String(r.start_time).slice(0, 5)} –
                      {String(r.end_time).slice(0, 5)}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: getStatusColor(r.status),
                          color: "#fff",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {String(r.status).toLowerCase() === "pending" ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleSetStatus(r.id, "approved")} style={styles.approveBtn}>
                            Approve
                          </button>
                          <button onClick={() => handleSetStatus(r.id, "cancelled")} style={styles.rejectBtn}>
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
      </div>

      {/* POPUP MODAL */}
      {panelOpen && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPanelOpen(false);
          }}
        >
          <div style={styles.modalContent}>
            <div style={styles.reservationPanelCard}>
              <div style={styles.reservationPanelHeader}>
                <div style={{ fontWeight: 700 }}>Reservations</div>
                <button onClick={() => setPanelOpen(false)} style={styles.panelCloseBtn}>
                  ✕
                </button>
              </div>

              <div style={{ fontSize: "13px", marginBottom: "10px", color: "#475569" }}>
                {selectedDate || ""}
              </div>

              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Room</div>
                <select
                  value={selectedRoomId || ""}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  style={styles.panelSelect}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Start</div>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.panelInput} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>End</div>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.panelInput} />
                </div>
              </div>

              <button
                onClick={async () => {
                  setPanelMessage("");

                  if (!selectedRoomId) return setPanelMessage("Please select a room.");
                  if (!selectedDate) return setPanelMessage("Please select a date.");
                  if (!startTime || !endTime) return setPanelMessage("Start and end time are required.");
                  if (startTime >= endTime) return setPanelMessage("Start time must be before end time.");

                  const reservedBy = Number(user?.id);
                  if (!Number.isInteger(reservedBy) || reservedBy <= 0) {
                    return setPanelMessage("You must be logged in to reserve a room.");
                  }

                  const hasConflict = dayReservations.some((r) => {
                    const status = String(r.status || "").toLowerCase();
                    if (status === "cancelled" || status === "rejected") return false;

                    const s = String(r.start_time).slice(0, 5);
                    const e = String(r.end_time).slice(0, 5);
                    return startTime < e && endTime > s;
                  });

                  if (hasConflict) return setPanelMessage("Time is already reserved.");

                  try {
                    await createReservation({
                      roomId: selectedRoomId,
                      reserved_by: reservedBy,
                      reservation_date: selectedDate,
                      start_time: startTime,
                      end_time: endTime,
                    });
                    setPanelMessage("✅ Reservation submitted (pending approval). ");
                    await loadDayReservations(selectedRoomId, selectedDate);
                    await loadCalendarEvents();
                  } catch (e) {
                    setPanelMessage(e.message || "Reservation failed.");
                  }
                }}
                style={styles.panelSubmitBtn}
              >
                Reserve
              </button>

              {panelMessage && <div style={styles.panelMessage}>{panelMessage}</div>}

              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                  Existing reservations
                </div>
                {loadingDay ? (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Loading...</div>
                ) : dayReservations.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>No reservations.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dayReservations.map((r) => (
                      <div key={r.id} style={styles.panelReservationRow}>
                        <div style={{ fontWeight: 600 }}>
                          {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {String(r.status || "").toLowerCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, dark }) {
  return (
    <div
      style={{
        ...styles.statCard,
        background: dark ? "#1f3b63" : "#fff",
        color: dark ? "#fff" : "#333",
      }}
    >
      <div style={styles.statTop}>
        <span>{title}</span>
        <span style={styles.icon}>★</span>
      </div>

      <h2 style={{ marginTop: "10px" }}>{value}</h2>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={styles.card}>
      <h4 style={{ marginBottom: "10px" }}>{title}</h4>

      <div style={{ width: "100%", height: "340px" }}>{children}</div>
    </div>
  );
}

function ProgressWidget() {
  return (
    <div style={styles.progressCard}>
      <h4>Progress</h4>

      <div style={styles.donut}>
        <div style={styles.donutInner}>45%</div>
      </div>

      <div style={styles.progressText}>
        <p>Lorem ipsum</p>
        <p>Lorem ipsum</p>
        <p>Lorem ipsum</p>
      </div>

      <button style={styles.orangeBtn}>Check Now</button>
    </div>
  );
}

function MiniCalendar({ events, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverData, setHoverData] = useState(null);

  // format Date -> YYYY-MM-DD (local)
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div style={styles.calendarCard}>
      {/* HEADER */}
      <div style={styles.calendarHeaderBar}>
        <button onClick={prevMonth} style={styles.calendarNavBtn}>◀</button>

        <h4>
          {currentDate.toLocaleString("default", { month: "long" })} {year}
        </h4>

        <button onClick={nextMonth} style={styles.calendarNavBtn}>▶</button>
      </div>

      {/* DAYS GRID */}
      <div style={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} style={styles.calendarWeek}>
            {d}
          </div>
        ))}

        {days.map((d, i) => {
          const reservations = events.filter((e) => {
            if (!d) return false;

            const [y, m, day] = e.date.split("-").map(Number);

            return (
              day === d &&
              m - 1 === month &&
              y === year
            );
          });

          const hasEvent = reservations.length > 0;

          const dateStr = d
            ? toYMD(new Date(year, month, d))
            : null;

          return (
            <div
              key={i}
              style={{
                ...styles.calendarDay,
                background: hasEvent ? "#f59e0b" : "transparent",
                color: hasEvent ? "#fff" : "#333",
              }}
              onMouseEnter={() => setHoverData(reservations)}
              onMouseLeave={() => setHoverData(null)}
              onClick={() => {
                if (!d) return;
                if (typeof onDateClick === "function") onDateClick(dateStr);
              }}
            >
              {d || ""}
            </div>
          );
        })}
      </div>

      {/* HOVER INFO */}
      {hoverData && hoverData.length > 0 && (
        <div style={styles.calendarTooltip}>
          {hoverData.map((r, i) => (
            <div key={i}>
              📍 {r.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboard: {
    padding: "25px",
    background: "#f5f7fb",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  refreshBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  chartGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gridTemplateRows: "auto auto",
    columnGap: "25px",
    rowGap: "35px",
    marginBottom: "60px",
  },

  card: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    height: "420px",
    marginBottom: "25px",
    overflow: "hidden",
  },

  row: {
    transition: "0.2s",
    cursor: "default",
  },

  tableCard: {
    background: "#ffffff",
    padding: "0",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginTop: "10px",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    fontSize: "14px",
  },

  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    fontWeight: "600",
    fontSize: "13px",
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
  },

  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#334155",
  },

  approveBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },

  rejectBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },

  progressCard: {
    background: "#0f172a",
    color: "#fff",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    textAlign: "center",
    height: "320px",
  },

  donut: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "6px solid #f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px auto",
  },

  donutInner: {
    fontSize: "22px",
    fontWeight: "bold",
  },

  progressText: {
    fontSize: "12px",
    color: "#777",
    marginBottom: "10px",
  },

  orangeBtn: {
    background: "#f59e0b",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  topCards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "50px",
  },

  statCard: {
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
    height: "100%",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    opacity: 0.8,
  },

  icon: {
    fontSize: "16px",
  },

  sideWidgets: {
    display: "grid",
    gridTemplateRows: "auto auto",
    gap: "20px",
    alignContent: "start",
  },

  calendarHeader: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "11px",
  },

  calendarHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  calendarNavBtn: {
    border: "none",
    background: "#eee",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    fontSize: "14px",
  },

  calendarWeek: {
    textAlign: "center",
    fontWeight: "bold",
  },

  calendarDay: {
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "0.2s",
    fontWeight: "500",
    userSelect: "none",
  },

  calendarTooltip: {
    marginTop: "10px",
    background: "#fff",
    padding: "8px",
    borderRadius: "6px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    fontSize: "12px",
  },

  calendarCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    height: "320px",
  },

  reservationPanelCard: {
    background: "#fff",
    padding: "14px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    height: "320px",
    overflow: "auto",
  },

  reservationPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  panelCloseBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: "1",
  },

  panelSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
  },

  panelInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    boxSizing: "border-box",
  },

  panelSubmitBtn: {
    width: "100%",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "2px",
  },

  panelMessage: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#0f172a",
  },

  panelReservationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "16px",
  },

  modalContent: {
    width: "80%",
    maxWidth: "800px",
  },
};