import { useEffect, useMemo, useState, useCallback } from "react";
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
  LineChart,
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

import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";

import { getUser } from "../services/authService";

function formatTime12(timeStr) {
  const t = String(timeStr || "").slice(0, 5);
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t);
  if (!m) return timeStr;

  const hh = Number(m[1]);
  const mm = m[2];
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${ampm}`;
}

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { theme, themeName } = useTheme();
  const isDarkMode = themeName === "dark";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const user = getUser();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD
  const [dayReservations, setDayReservations] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [panelMessage, setPanelMessage] = useState("");

  const usedRooms = useMemo(() => {
    return reservations.filter(
      (r) => String(r.status).toLowerCase() === "approved"
    ).length;
  }, [reservations]);

  const totalRooms = rooms.length;

  const availableRooms = totalRooms - usedRooms;

  const usageRate = totalRooms
    ? Math.min(100, Math.round((usedRooms / totalRooms) * 100))
    : 0;

  const refresh = useCallback(async () => {
    try {
      const s = await getAdminStats();
      setStats(s?.reservations || null);

      const list = await getAdminRoomReservations();
      setReservations(Array.isArray(list) ? list : []);
    } catch (e) {
      setStats(null);
      setReservations([]);
      toast.push({
        type: "error",
        title: "Failed to load admin data",
        description:
          e?.message ||
          "Request failed. If ADMIN_API_KEY is enabled on the backend, make sure REACT_APP_ADMIN_API_KEY is set on the frontend.",
      });
    }
  }, [toast]);

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function loadDayReservations(roomId, dateStr) {
    if (!roomId || !dateStr) return;
    setLoadingDay(true);
    setPanelMessage("");
    try {
      const data = await getRoomReservationsByDate({ roomId, date: dateStr });
      setDayReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      setDayReservations([]);
      setPanelMessage(e?.message || "Failed to load reservations.");
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    if (panelOpen && selectedRoomId && selectedDate) {
      loadDayReservations(selectedRoomId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

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
      await updateReservationStatus({ id, status });
      await refresh();
    } catch (e) {
      const raw = String(e?.message || "");
      const statusLower = String(status || "").toLowerCase();

      if (statusLower === "approved" && raw.toLowerCase().includes("already ended")) {
        toast.push({
          type: "warning",
          title: "Cannot approve",
          description: "This time and date have already past so it can't be approved.",
        });
        return;
      }

      toast.push({ type: "error", title: "Update failed", description: raw || "Failed to update status." });
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

  const ui = useMemo(() => {
    const border = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
    const tableHeaderBg = isDarkMode ? "rgba(255,255,255,0.06)" : "#f8fafc";
    const tableRowBorder = isDarkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9";
    const mutedText = isDarkMode ? "rgba(255,255,255,0.72)" : "#475569";
    const text = theme.text;
    return {
      dashboard: { ...styles.dashboard, background: theme.bg, color: text },
      header: { ...styles.header, color: text },
      topCards: { ...styles.topCards },
      chartGrid: { ...styles.chartGrid },
      table: { ...styles.table },
      card: { background: theme.card, color: text, boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)" },
      tableCard: { ...styles.tableCard, background: theme.card, boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)", overflowX: 'auto', overflowY: 'hidden' },
      th: { background: tableHeaderBg, color: mutedText, borderBottom: `1px solid ${border}` },
      td: { color: text, borderBottom: `1px solid ${tableRowBorder}` },
      progressCard: { background: theme.card, color: text, boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)" },
      donutInner: { background: theme.card, color: text },
      progressText: { color: mutedText },
      calendarNavBtn: { background: isDarkMode ? "rgba(255,255,255,0.08)" : "#eee", color: text },
      approveBtn: { background: "#2563eb", color: "#fff" },
      rejectBtn: { background: "#dc2626", color: "#fff" },
      panelCardBg: theme.card,
      panelMutedText: mutedText,
    };
  }, [isDarkMode, theme.bg, theme.card, theme.text]);

  return (
    <div style={ui.dashboard}>
      {/* HEADER */}
      <div style={ui.header}>
        <h2>Dashboard User</h2>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          ...ui.topCards,
          ...(isMobile && {
            gridTemplateColumns: "1fr 1fr",
            gap: "12px", // 🔥 dagdag space
          }),
        }}
      >
        <Card title="Total Reservations" value={total} isMobile={isMobile} />
        <Card title="Pending" value={pending} isMobile={isMobile} />
        <Card title="Approved" value={approved} isMobile={isMobile} />
        <Card title="Cancelled" value={cancelled} isMobile={isMobile} />
      </div>

      {/* CHARTS */}
      <div
        style={{
          ...ui.chartGrid,
          ...(isMobile && {
            gridTemplateColumns: "1fr",
          }),
        }}
      >
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

        <ProgressWidget
          usageRate={usageRate}
          usedRooms={usedRooms}
          availableRooms={availableRooms}
        />

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
          onDateClick={(dateStr) => {
            setSelectedDate(dateStr);
            setPanelOpen(true);
            if (selectedRoomId) loadDayReservations(selectedRoomId, dateStr);
          }}
        />
      </div>

      {/* TABLE */}
      <div style={{ marginTop: "30px" }}>
        <h3>Pending Room Reservations</h3>

        <div style={ui.tableCard}>
          <table
            style={{
              ...ui.table,
              minWidth: isMobile ? "720px" : "100%", // 🔥 para scrollable
            }}
          >
            <thead>
              <tr>
                <th style={ui.th}>Requested By</th>
                <th style={ui.th}>Section</th>
                <th style={ui.th}>Room</th>
                <th style={ui.th}>Date</th>
                <th style={ui.th}>Time</th>
                <th style={{ ...ui.th, textAlign: "center" }}>Status</th>
                <th style={{ ...ui.th, textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyRow}>
                    No pending reservations
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} style={styles.row}>
                    <td style={ui.td}>
                      {r.reserved_by_name || `User #${r.reserved_by}`}
                    </td>

                    <td style={ui.td}>{r.reserved_by_section || "—"}</td>

                    <td style={ui.td}>{r.room_name}</td>

                    <td style={ui.td}>
                      {String(r.reservation_date).slice(0, 10)}
                    </td>

                    <td style={ui.td}>
                      {formatTime12(r.start_time)} –{" "}
                      {formatTime12(r.end_time)}
                    </td>

                    <td style={{ ...ui.td, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "92px",
                          padding: "5px 12px",
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

                    <td style={{ ...ui.td, textAlign: "center" }}>
                      {String(r.status).toLowerCase() === "pending" ? (
                        <div
                          style={{
                            ...styles.actionBtns,
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? "6px" : styles.actionBtns.gap,
                            alignItems: "stretch",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleSetStatus(r.id, "approved")
                            }
                            style={{ ...ui.approveBtn, width: isMobile ? "100%" : "auto" }}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleSetStatus(r.id, "cancelled")
                            }
                            style={{ ...ui.rejectBtn, width: isMobile ? "100%" : "auto" }}
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
            <div
              style={{
                ...styles.reservationPanelCard,
                background: ui.panelCardBg,
                color: theme.text,
                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              <div style={styles.reservationPanelHeader}>
                <div style={{ fontWeight: 700 }}>Reservations</div>
                <button
                  onClick={() => setPanelOpen(false)}
                  style={{ ...styles.panelCloseBtn, color: theme.text }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: "13px", marginBottom: "10px", color: ui.panelMutedText }}>
                {selectedDate || ""}
              </div>

              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Room</div>
                <select
                  value={selectedRoomId || ""}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  style={{
                    ...styles.panelSelect,
                    background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff",
                    color: theme.text,
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
                  }}
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
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      ...styles.panelInput,
                      background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff",
                      color: theme.text,
                      border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>End</div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      ...styles.panelInput,
                      background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff",
                      color: theme.text,
                      border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={async () => {
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
                  } catch (e) {
                    setPanelMessage(e.message || "Reservation failed.");
                  }
                }}
                style={styles.panelSubmitBtn}
              >
                Reserve
              </button>

              {panelMessage && (
                <div
                  style={{
                    ...styles.panelMessage,
                    color: isDarkMode ? "rgba(255,255,255,0.85)" : styles.panelMessage.color,
                  }}
                >
                  {panelMessage}
                </div>
              )}

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
                      <div
                        key={r.id}
                        style={{
                          ...styles.panelReservationRow,
                          background: isDarkMode ? "rgba(255,255,255,0.04)" : "#f8fafc",
                          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
                          color: theme.text,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {formatTime12(r.start_time)} – {formatTime12(r.end_time)}
                        </div>
                        <div style={{ fontSize: "12px", color: ui.panelMutedText }}>
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

function Card({ title, value, dark, isMobile }) {
  const { theme, themeName } = useTheme();
  const isDarkMode = themeName === "dark";
  return (
    <div
      style={{
        background: theme.card,
        color: theme.text,
        padding: isMobile ? "14px" : "20px",
        borderRadius: "12px",
        boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)",
        minHeight: isMobile ? "90px" : "120px",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>
        {title}
      </div>

      <h2
        style={{
          marginTop: isMobile ? "6px" : "10px",
          fontSize: isMobile ? "18px" : "24px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function ChartCard({ title, children }) {
  const { theme, themeName } = useTheme();
  const isDarkMode = themeName === "dark";
  return (
    <div style={{ background: theme.card, color: theme.text, padding: "20px", borderRadius: "12px", boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)" }}>
      <h4 style={{ marginBottom: "10px", color: theme.text }}>{title}</h4>

      <div style={{ width: "100%", height: "340px" }}>{children}</div>
    </div>
  );
}

function ProgressWidget({ usageRate, usedRooms, availableRooms }) {
  const { theme, themeName } = useTheme();
  const isDarkMode = themeName === "dark";
  const muted = isDarkMode ? "rgba(255,255,255,0.75)" : "#334155";
  return (
    <div style={{ background: theme.card, color: theme.text, padding: "20px", borderRadius: "12px", boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)" }}>
      <h4 style={{ marginBottom: "10px", color: theme.text }}>Room Usage</h4>

      <div
        style={{
          width: "100%",
          height: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `conic-gradient(#f59e0b ${usageRate}%, #e5e7eb ${usageRate}%)`,
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1, color: theme.text }}>{usageRate}%</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: muted }}>
        <p>🟠 Used: {usedRooms}</p>
        <p>🔵 Available: {availableRooms}</p>
      </div>

      <button style={{ background: "#f59e0b", color: "#fff", padding: "8px 14px", borderRadius: "8px" }}>
        View Rooms
      </button>
    </div>
  );
}

function MiniCalendar({ onDateClick }) {
  const { theme, themeName } = useTheme();
  const isDarkMode = themeName === "dark";
  const weekText = isDarkMode ? "rgba(255,255,255,0.75)" : theme.text;
  const dayText = isDarkMode ? "rgba(255,255,255,0.85)" : "#111";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const [hoverData, setHoverData] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(null);

  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const loadEvents = async (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10);

    try {
      const data = await getEvents({ start, end });
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents(currentDate);
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div style={{ background: theme.card, color: theme.text, padding: "20px", borderRadius: "12px", boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.08)" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "#eee", color: theme.text, padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", minWidth: 44 }}
        >
          ‹
        </button>

        <h4 style={{ color: theme.text, margin: 0, flex: 1, textAlign: "center" }}>
          {currentDate.toLocaleString("default", { month: "long" })} {year}
        </h4>

        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "#eee", color: theme.text, padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", minWidth: 44 }}
        >
          ›
        </button>

      </div>

      {/* GRID */}
      <div style={styles.calendarGrid}>

        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) =>
          <div key={d} style={{ ...styles.calendarWeek, color: weekText }}>{d}</div>
        )}

        {days.map((d, i) => {

          if (!d) return <div key={i}></div>

          const dateStr = toYMD(new Date(year, month, d))

          const reservations = events.filter((e) =>
            e.start.slice(0, 10) === dateStr
          )

          const hasEvent = reservations.length > 0
          const isSelected = selectedDate === dateStr

          return (
            <div
              key={i}

              style={{
                ...styles.calendarDay,
                background: isSelected
                  ? "#3b82f6"
                  : hasEvent
                    ? "#f97316"
                    : "transparent",
                color: isSelected || hasEvent ? "#fff" : dayText
              }}

              onMouseEnter={(e) => {
                if (reservations.length > 0) {
                  setHoverData(reservations)
                  setHoverPos({
                    x: e.clientX,
                    y: e.clientY
                  })
                }
              }}

              onMouseLeave={()=>setHoverData(null)}

              onClick={()=>{

                setSelectedDate(dateStr)

                if(onDateClick)
                  onDateClick(dateStr)

              }}

            >
              {d}

            </div>

          )

        })}

      </div>

      {/* HOVER TOOLTIP */}

      {hoverData && (

        <div
          style={{
            position:"fixed",
            top:hoverPos.y + 10,
            left:hoverPos.x + 10,
            background:"#111",
            color:"#fff",
            padding:"8px",
            borderRadius:"6px",
            fontSize:"12px",
            pointerEvents:"none",
            zIndex:999
          }}
        >

          {hoverData.map((r,i)=>(

            <div key={i}>
              {r.title}
            </div>

          ))}

        </div>

      )}

    </div>

  )

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
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
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
    overflowX: "auto", // 🔥 ADD THIS
    WebkitOverflowScrolling: "touch",
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
    background: "#ffffff",
    color: "#334155",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    height: "420px",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // 🔥 THIS centers vertically
    alignItems: "center",
  },

  donut: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px auto",
    position: "relative"
  },

  donutInner: {
    position: "absolute",
    width: "100px",
    height: "100px",
    background: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    height: "auto",

    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // 🔥 important
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

  actionBtns: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },

  emptyRow: {
    textAlign: "center",
    padding: "20px",
    color: "#64748b",
    fontSize: "14px",
  }

  
};