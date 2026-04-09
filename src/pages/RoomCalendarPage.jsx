import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "../components/services/authService";
import "react-calendar/dist/Calendar.css";
import "../styles/calendar.css";
import Calendar from "react-calendar";
import { startOfMonth, endOfMonth } from "date-fns";
import { useTheme } from "../context/ThemeContext";
import {
  getLabRooms,
  getEvents,
  getRoomReservationsByDate,
  createReservation,
  updateReservationStatus,
} from "../helper/api";

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

export default function RoomCalendarPage() {

  const { theme } = useTheme();

  const user = getUser();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [miniDate, setMiniDate] = useState(new Date());

  // ROOMS
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);

  const [reservedDates, setReservedDates] = useState([]);

  // CALENDAR
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });

  // SIDE PANEL
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayReservations, setDayReservations] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  // RESERVE FORM
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [message, setMessage] = useState("");

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // LOAD ROOMS
  useEffect(() => {

    (async () => {

      try {

        const data = await getLabRooms();

        setRooms(data || []);

        if (Array.isArray(data)) {
          setSelectedRooms(data.map(r => r.id));
        }

      } catch (e) {

        console.error(e);

      }

    })();

  }, []);

  // LOAD EVENTS
  useEffect(() => {

    if (!range.start || !range.end) return;

    (async () => {

      try {

        const data = await getEvents({
          start: range.start,
          end: range.end,
          roomIds: selectedRooms.length ? selectedRooms : null
        });

        setEvents(data || []);

      } catch (e) {

        console.error(e);

      }

    })();

  }, [range, selectedRooms]);

  useEffect(() => {

    const start = toYMD(startOfMonth(miniDate))
    const end = toYMD(endOfMonth(miniDate))

    const load = async () => {

      try {

        const data = await getEvents({
          start,
          end,
          roomIds: selectedRooms.length ? selectedRooms : null
        })

        if (Array.isArray(data)) {

          const dates = [...new Set(
            data.map(e => e.start.slice(0,10))
          )]

          setReservedDates(dates)

        }

      } catch (e) {

        console.error(e)

      }

    }

    load()

  }, [miniDate, selectedRooms])

  const loadDayReservations = async (dateStr) => {

    if (!dateStr) return;

    setLoadingDay(true);

    try {

      const data = await getRoomReservationsByDate({
        date: dateStr
      });

      setDayReservations(data || []);

    } catch (e) {

      console.error(e);

    } finally {

      setLoadingDay(false);

    }

  };

  const handleSetStatus = async (reservationId, status) => {

    if (!isAdmin) return;

    try {

      await updateReservationStatus({ id: reservationId, status });

      setMessage(`Reservation ${status}`);

      await loadDayReservations(selectedDate);

      setRange(r => ({ ...r }));

    } catch (e) {

      const raw = String(e?.message || "");
      const statusLower = String(status || "").toLowerCase();

      if (statusLower === "approved" && raw.toLowerCase().includes("already ended")) {
        setMessage("This time and date have already past so it can't be approved.");
        return;
      }

      setMessage(raw || "Failed to update status.");

    }

  };

  const submitReservation = async () => {

    setMessage("");

    if (!selectedDate) return setMessage("Please select a date.");
    if (!startTime || !endTime) return setMessage("Time required.");
    if (startTime >= endTime) return setMessage("Start must be before end.");

    if (!selectedRooms.length)
      return setMessage("Please select a room.");

    const reservedBy = Number(user?.id);
    if (!reservedBy)
      return setMessage("Login required.");

    const roomId = selectedRooms[0];

    try {

      await createReservation({
        roomId,
        reserved_by: reservedBy,
        reservation_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });

      setMessage("✅ Reservation submitted.");

      await loadDayReservations(selectedDate);

      setRange((r) => ({ ...r }));

    } catch (e) {

      console.error(e);

      setMessage("Reservation failed.");

    }

  };

  const pendingCount = useMemo(() => {

    return dayReservations.filter(r =>
      String(r.status).toLowerCase() === "pending"
    ).length;

  }, [dayReservations]);

  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#000000";

  return (

    <div className={isDark ? "dark" : ""}>

      <div style={{ padding: isMobile ? "0px 12px 10px 12px" : "0px 30px 10px 30px" }}>

        <h2>Lab Room Reservations</h2>

        <div
          className="calendarLayout"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "minmax(0,1fr)"
              : (panelOpen ? "260px minmax(0,1fr) 320px" : "260px minmax(0,1fr)"),
            gap: 16,
            overflowX: isMobile ? "hidden" : "auto"
          }}
        >

          {/* SIDEBAR */}
          <div className="sidebar">

            <Calendar
              value={miniDate}
              calendarType="gregory"
              onActiveStartDateChange={({ activeStartDate }) => {
                setMiniDate(activeStartDate)
              }}
              tileClassName={({ date }) => {
                const d = toYMD(date)
                if (reservedDates.includes(d)) return "reserved-day"
              }}
              onChange={(date) => {
                setMiniDate(date)
                const ymd = toYMD(date)
                setSelectedDate(ymd)
                setPanelOpen(true)
                loadDayReservations(ymd)
              }}
            />

            <div className="roomListBox">

              <h4>My Calendars</h4>

              <div className="roomList">

                <label>
                  <input
                    type="checkbox"
                    checked={selectedRooms.length === rooms.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRooms(rooms.map(r => r.id));
                      } else {
                        setSelectedRooms([]);
                      }
                    }}
                  />
                  All Rooms
                </label>

                {rooms.map((r) => (
                  <label key={r.id}>
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(r.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRooms([...selectedRooms, r.id]);
                        } else {
                          setSelectedRooms(
                            selectedRooms.filter(id => id !== r.id)
                          );
                        }
                      }}
                    />
                    {r.room_name}
                  </label>
                ))}

              </div>

            </div>

          </div>

          {/* MAIN CALENDAR */}
          <div
            className="calendarShell"
            style={{
              background: theme.card,
              color: theme.text,
              marginTop: "1px",
              minHeight: isMobile ? "70vh" : undefined,
            }}
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              height="100%"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "timeGridWeek,timeGridDay,dayGridMonth",
              }}
              slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              nowIndicator={true}
              allDaySlot={false}
              events={events}
              datesSet={(info) => {
                setRange({
                  start: toYMD(info.start),
                  end: toYMD(info.end),
                });
              }}
              dateClick={(arg) => {
                setSelectedDate(arg.dateStr);
				setPanelOpen(true);
				loadDayReservations(arg.dateStr);
              }}
            />
          </div>

          {/* SIDE PANEL */}
          {panelOpen && !isMobile && (
            <div
              className="calendarSidePanel"
              style={{
                background: isDark ? "#101214" : "#ffffff",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(0,0,0,0.1)",
                borderRadius: 18,
                padding: 16,
                height: "fit-content",
                maxHeight: isMobile ? "none" : "80vh",
                overflowY: "auto",
                color: textColor,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  {/* FIXED: hardcoded text color */}
                  <div style={{ fontWeight: 700, color: textColor }}>
                    {selectedDate}
                  </div>

                  {isAdmin && (
                    <div style={{ color: textColor }}>Pending: {pendingCount}</div>
                  )}
                </div>

                <button onClick={() => setPanelOpen(false)}>Close</button>
              </div>

              <hr />

              {loadingDay ? (
                <div style={{ color: textColor, fontWeight: 600 }}>Loading...</div>
              ) : (
                dayReservations.map((r) => (
                  <div key={r.id} style={{ marginBottom: 10, color: textColor }}>
                    {formatTime12(r.start_time)} - {formatTime12(r.end_time)}

                    <div style={{ color: textColor }}>Status: {r.status}</div>

                    {isAdmin && r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleSetStatus(r.id, "approved")}>Approve</button>
                        <button onClick={() => handleSetStatus(r.id, "rejected")}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}

              <hr />

              <div>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

                <button onClick={submitReservation}>Reserve</button>

                {message && (
                  <div style={{ color: textColor, fontWeight: "600" }}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          )}

		  {/* MOBILE POPUP PANEL */}
		  {panelOpen && isMobile && (
			  <div
				role="dialog"
				aria-modal="true"
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.55)",
					zIndex: 1000,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: 12,
				}}
				onClick={() => setPanelOpen(false)}
			  >
				<div
					className="calendarSidePanel"
					style={{
						background: isDark ? "#101214" : "#ffffff",
						border: isDark
							? "1px solid rgba(255,255,255,0.2)"
							: "1px solid rgba(0,0,0,0.1)",
						borderRadius: 18,
						padding: 16,
						width: "100%",
						maxWidth: 520,
						maxHeight: "86vh",
						overflowY: "auto",
						color: textColor,
						boxShadow: isDark
							? "0 14px 40px rgba(0,0,0,0.55)"
							: "0 14px 40px rgba(0,0,0,0.20)",
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div style={{ display: "flex", justifyContent: "space-between" }}>
						<div>
							<div style={{ fontWeight: 700, color: textColor }}>
								{selectedDate}
							</div>

							{isAdmin && (
								<div style={{ color: textColor }}>Pending: {pendingCount}</div>
							)}
						</div>

						<button onClick={() => setPanelOpen(false)}>Close</button>
					</div>

					<hr />

					{loadingDay ? (
						<div style={{ color: textColor, fontWeight: 600 }}>Loading...</div>
					) : (
						dayReservations.map((r) => (
							<div key={r.id} style={{ marginBottom: 10, color: textColor }}>
								{formatTime12(r.start_time)} - {formatTime12(r.end_time)}

								<div style={{ color: textColor }}>Status: {r.status}</div>

								{isAdmin && r.status === "pending" && (
									<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
										<button onClick={() => handleSetStatus(r.id, "approved")}>Approve</button>
										<button onClick={() => handleSetStatus(r.id, "rejected")}>Reject</button>
									</div>
								)}
							</div>
						))
					)}

					<hr />

					<div>
						<input
							type="time"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							style={isMobile ? { fontSize: "16px" } : undefined}
						/>
						<input
							type="time"
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
							style={isMobile ? { fontSize: "16px" } : undefined}
						/>

						<button onClick={submitReservation}>Reserve</button>

						{message && (
							<div style={{ color: textColor, fontWeight: "600" }}>
								{message}
							</div>
						)}
					</div>
				</div>
			  </div>
		  )}
        </div>
      </div>
    </div>
  );
}
