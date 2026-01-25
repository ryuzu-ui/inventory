import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "../components/services/authService";
import "../styles/calendar.css";

const API_BASE = "http://localhost:5000";

// format Date -> YYYY-MM-DD (local)
function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function RoomCalendarPage() {
  const user = getUser();

  // rooms (ALWAYS array)
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // calendar
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });

  // side panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD
  const [dayReservations, setDayReservations] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  // reserve form
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [message, setMessage] = useState("");

  // =========================
  // LOAD ROOMS (SAFE)
  // =========================
  useEffect(() => {
    fetch(`${API_BASE}/api/lab-rooms`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          console.error("Invalid rooms response:", data);
          setRooms([]);
          setMessage(data?.error || "Failed to load rooms.");
          return;
        }

        setRooms(data);

        if (data.length && selectedRoomId === null) {
          setSelectedRoomId(data[0].id);
        }
      })
      .catch((e) => {
        console.error("Rooms fetch error:", e);
        setRooms([]);
        setMessage("Failed to load rooms.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // LOAD EVENTS (DYNAMIC)
  // =========================
  useEffect(() => {
    if (!range.start || !range.end) return;

    const params = new URLSearchParams();
    params.set("start", range.start);
    params.set("end", range.end);
    if (selectedRoomId) params.set("roomId", String(selectedRoomId));

    fetch(`${API_BASE}/api/room-reservations/events?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          console.error("Events API error:", data);
          setEvents([]);
          return;
        }
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("Events fetch error:", e);
        setEvents([]);
      });
  }, [range, selectedRoomId]);

  // =========================
  // LOAD DAY RESERVATIONS
  // =========================
  const loadDayReservations = async (roomId, dateStr) => {
    if (!roomId || !dateStr) return;
    setLoadingDay(true);
    setMessage("");

    try {
      const res = await fetch(
        `${API_BASE}/api/lab-rooms/${roomId}/reservations?date=${dateStr}`
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("Day reservations API error:", data);
        setDayReservations([]);
        setMessage(data?.error || "Failed to load reservations.");
        return;
      }
      setDayReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Day reservations fetch error:", e);
      setDayReservations([]);
      setMessage("Failed to load reservations.");
    } finally {
      setLoadingDay(false);
    }
  };

  // reload side panel when room changes
  useEffect(() => {
    if (panelOpen && selectedRoomId && selectedDate) {
      loadDayReservations(selectedRoomId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  // =========================
  // SUBMIT RESERVATION (PENDING)
  // =========================
  const submitReservation = async () => {
    setMessage("");

    if (!selectedRoomId) return setMessage("Please select a room.");
    if (!selectedDate) return setMessage("Please click a date on the calendar.");
    if (!startTime || !endTime) return setMessage("Start and end time are required.");
    if (startTime >= endTime) return setMessage("Start time must be before end time.");

    // Use actual logged-in user id if available; fallback to 1 for dummy user
    const reservedBy = user?.id ?? user?.user_id ?? user?.userId ?? 1;

    try {
      const res = await fetch(
        `${API_BASE}/api/lab-rooms/${selectedRoomId}/reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reserved_by: reservedBy,
            reservation_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return setMessage(data?.error || "Reservation failed.");
      }

      setMessage("✅ Reservation submitted (pending approval).");
      await loadDayReservations(selectedRoomId, selectedDate);

      // Refresh events (approved only)
      setRange((r) => ({ ...r }));
    } catch (e) {
      console.error("Reservation POST error:", e);
      setMessage("Reservation failed.");
    }
  };

  // Safe room name lookup
  const selectedRoomName = useMemo(() => {
    if (!Array.isArray(rooms)) return "";
    const r = rooms.find((x) => x.id === selectedRoomId);
    return r?.room_name || "";
  }, [rooms, selectedRoomId]);

  // =========================
  // RENDER
  // =========================
  return (
    <div style={{ padding: 20 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Lab Room Reservations</h2>

        {/* Room filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Room:</span>
          <select
            value={selectedRoomId ?? ""}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              background: "#1b1f24",
              color: "white",
              border: "1px solid rgba(255,255,255,0.15)",
              fontWeight: 700,
            }}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: panelOpen ? "1fr 360px" : "1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Calendar */}
        <div className="calendarShell">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            nowIndicator={true}
            dayMaxEvents={true}
            stickyHeaderDates={true}
            eventDisplay="block"
            events={events}
            datesSet={(info) => {
              setRange({ start: toYMD(info.start), end: toYMD(info.end) });
            }}
            dateClick={(arg) => {
              setSelectedDate(arg.dateStr);
              setPanelOpen(true);
              loadDayReservations(selectedRoomId, arg.dateStr);
            }}
          />
          <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
            Tip: Click a date to view reservations and submit a booking request.
          </div>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <div
            style={{
              background: "#101214",
              borderRadius: 18,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              position: "sticky",
              top: 90,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{selectedRoomName}</div>
                <div style={{ opacity: 0.85, marginTop: 2 }}>{selectedDate}</div>
              </div>

              <button
                onClick={() => setPanelOpen(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                  height: 38,
                }}
              >
                Close
              </button>
            </div>

            <hr style={{ borderColor: "rgba(255,255,255,0.10)", margin: "14px 0" }} />

            {/* Reservations list */}
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Reservations</div>

            {loadingDay ? (
              <div style={{ opacity: 0.8 }}>Loading…</div>
            ) : dayReservations.length === 0 ? (
              <div style={{ opacity: 0.8 }}>No reservations for this day.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {dayReservations.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 2 }}>
                      Status: <span style={{ fontWeight: 800 }}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <hr style={{ borderColor: "rgba(255,255,255,0.10)", margin: "14px 0" }} />

            {/* Reserve form */}
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Reserve a time</div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ opacity: 0.85, fontWeight: 700 }}>Start time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    background: "#1b1f24",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ opacity: 0.85, fontWeight: 700 }}>End time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    background: "#1b1f24",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontWeight: 700,
                  }}
                />
              </div>

              <button
                onClick={submitReservation}
                style={{
                  padding: "11px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.10)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                  letterSpacing: 0.2,
                }}
              >
                Submit (Pending Approval)
              </button>

              {message && (
                <div style={{ marginTop: 4, opacity: 0.95, fontWeight: 700 }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
