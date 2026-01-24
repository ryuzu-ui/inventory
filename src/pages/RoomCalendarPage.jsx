import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "../components/services/authService"; // adjust path if needed

// Helper: format Date -> YYYY-MM-DD in local time
function toYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function RoomCalendarPage() {
  const user = getUser(); // should contain user info (id/role/etc). If not, we’ll handle it.

  // Room dropdown (we will fetch this from backend)
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Calendar events
  const [events, setEvents] = useState([]);

  // Calendar visible range (dynamic)
  const [range, setRange] = useState({ start: null, end: null });

  // Side panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // "YYYY-MM-DD"
  const [dayReservations, setDayReservations] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [message, setMessage] = useState("");

  // Reserve form
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");

  // --- A) Load rooms once ---
  useEffect(() => {
    fetch("http://localhost:5000/api/lab-rooms")
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        // Default to first room
        if (data?.length && selectedRoomId === null) {
          setSelectedRoomId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load rooms:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- B) Load calendar events whenever range OR room changes ---
  useEffect(() => {
    if (!range.start || !range.end) return;

    const params = new URLSearchParams();
    params.set("start", range.start);
    params.set("end", range.end);

    // Optional filter by room
    if (selectedRoomId) params.set("roomId", String(selectedRoomId));

    fetch(`http://localhost:5000/api/room-reservations/events?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err));
  }, [range, selectedRoomId]);

  // --- C) Load reservations for a day (side panel) ---
  const loadDayReservations = async (roomId, dateStr) => {
    if (!roomId || !dateStr) return;
    setLoadingDay(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/lab-rooms/${roomId}/reservations?date=${dateStr}`
      );
      const data = await res.json();
      setDayReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDayReservations([]);
    } finally {
      setLoadingDay(false);
    }
  };

  // When user changes room, refresh side panel (if open)
  useEffect(() => {
    if (panelOpen && selectedRoomId && selectedDate) {
      loadDayReservations(selectedRoomId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  // --- D) Reserve (POST) ---
  const onReserve = async () => {
    setMessage("");

    if (!selectedRoomId) return setMessage("Please select a room.");
    if (!selectedDate) return setMessage("Please select a date.");
    if (!startTime || !endTime) return setMessage("Start and end time are required.");

    // Try to get a user id from auth; fallback to 1 if you only have dummy user
    const reservedBy = user?.id ?? user?.user_id ?? 1;

    try {
      const res = await fetch(
        `http://localhost:5000/api/lab-rooms/${selectedRoomId}/reservations`,
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
        // Example: { error: "Time slot is already reserved" }
        return setMessage(data?.error || "Failed to create reservation.");
      }

      setMessage("✅ Reservation submitted (pending approval).");

      // Refresh side panel list
      await loadDayReservations(selectedRoomId, selectedDate);

      // Refresh calendar events (approved only)
      // No need to change range; just trigger fetch by re-setting same range:
      setRange((r) => ({ ...r }));
    } catch (e) {
      console.error(e);
      setMessage("Failed to create reservation.");
    }
  };

  // Simple mapping for display
  const selectedRoomName = useMemo(() => {
    const r = rooms.find((x) => x.id === selectedRoomId);
    return r?.room_name || "";
  }, [rooms, selectedRoomId]);

  return (
    <div style={{ padding: 20 }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>CTHM Lab Room Calendar</h2>

        {/* Room dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ opacity: 0.85 }}>Room:</label>
          <select
            value={selectedRoomId ?? ""}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "#1e1e1e",
              color: "white",
              border: "1px solid rgba(255,255,255,0.15)",
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

      {/* Calendar + Side Panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: panelOpen ? "1fr 360px" : "1fr", gap: 14 }}>
        {/* Calendar */}
        <div style={{ background: "#121212", borderRadius: 16, padding: 12 }}>
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
            events={events}
            // ✅ (1) Dynamic loading: detect visible date range
            datesSet={(info) => {
              // FullCalendar gives Date objects
              // info.startStr/info.endStr are ISO strings; we’ll convert to YYYY-MM-DD
              const start = toYMD(info.start);
              const end = toYMD(info.end);
              setRange({ start, end });
            }}
            // ✅ (2) Date click -> open side panel & fetch reservations
            dateClick={(arg) => {
              const dateStr = arg.dateStr; // YYYY-MM-DD
              setSelectedDate(dateStr);
              setPanelOpen(true);
              loadDayReservations(selectedRoomId, dateStr);
            }}
          />
        </div>

        {/* Side Panel */}
        {panelOpen && (
          <div
            style={{
              background: "#141414",
              borderRadius: 16,
              padding: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              height: "fit-content",
              position: "sticky",
              top: 90,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedRoomName}</div>
                <div style={{ opacity: 0.8, marginTop: 2 }}>{selectedDate}</div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <hr style={{ borderColor: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

            <div style={{ fontWeight: 700, marginBottom: 8 }}>Reservations</div>

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
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 2 }}>Status: {r.status}</div>
                  </div>
                ))}
              </div>
            )}

            <hr style={{ borderColor: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

            <div style={{ fontWeight: 700, marginBottom: 8 }}>Make a reservation</div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ opacity: 0.85 }}>Start time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#1e1e1e",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ opacity: 0.85 }}>End time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#1e1e1e",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              <button
                onClick={onReserve}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.10)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Submit Reservation (Pending)
              </button>

              {message && (
                <div style={{ marginTop: 6, opacity: 0.95 }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
        Tip: Click any date to open the side panel. Use the room dropdown to filter.
      </div>
    </div>
  );
}
