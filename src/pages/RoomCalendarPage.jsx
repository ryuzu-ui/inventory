import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "../components/services/authService";
import "../styles/calendar.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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

export default function RoomCalendarPage() {

  const user = getUser();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [reserveModalOpen, setReserveModalOpen] = useState(false);

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



  // LOAD ROOMS
  useEffect(() => {

    (async () => {

      try {

        const data = await getLabRooms();

        setRooms(data || []);

        if (Array.isArray(data)) {
          setSelectedRooms(data.map(r => r.id)); // auto select all
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

        if (Array.isArray(data)) {

          const dates = [...new Set(data.map(e => e.start.slice(0,10)))];
          setReservedDates(dates);

        }

      } catch (e) {

        console.error(e);

      }

    })();

  }, [range, selectedRooms]);



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

      console.error(e);

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

    const roomId = selectedRooms[0]; // first checked room

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



  return (

    <div style={{ padding: 20 }}>

      <h2>Lab Room Reservations</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
          height: "80vh"
        }}
      >

        {/* SIDEBAR */}
        <div
          style={{
            background: "#101214",
            padding: 16,
            borderRadius: 14
          }}
        >

          <Calendar
            value={miniDate}
            calendarType="gregory"

            tileClassName={({ date }) => {

              const d = toYMD(date);

              if (reservedDates.includes(d)) {
                return "reserved-day";
              }

            }}

            onChange={(date) => {

              setMiniDate(date);

              const ymd = toYMD(date);

              setSelectedDate(ymd);

              setPanelOpen(true);

              loadDayReservations(ymd);

            }}
          />

          <h4 style={{ marginTop: 20 }}>My Calendars</h4>

          <div style={{ display: "grid", gap: 8 }}>

            {/* ALL ROOMS */}
            <label style={{ display: "flex", gap: 8 }}>

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

              <label key={r.id} style={{ display: "flex", gap: 8 }}>

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



        {/* MAIN CALENDAR */}
        <div className="calendarShell">

          <FullCalendar

            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}

            initialView="timeGridWeek"

            height="100%"

            headerToolbar={{
              left:"prev,next today",
              center:"title",
              right:"timeGridWeek,timeGridDay,dayGridMonth"
            }}

            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"

            nowIndicator={true}

            allDaySlot={false}

            events={events}

            datesSet={(info) => {

              setRange({
                start: toYMD(info.start),
                end: toYMD(info.end)
              });

            }}

            dateClick={(arg) => {

              setSelectedDate(arg.dateStr);
              setReserveModalOpen(true);

            }}

          />

        </div>



        {/* SIDE PANEL */}
        {panelOpen && (

          <div
            style={{
              background:"#101214",
              borderRadius:18,
              padding:16
            }}
          >

            <div style={{display:"flex",justifyContent:"space-between"}}>

              <div>

                <div>{selectedDate}</div>

                {isAdmin && (
                  <div>Pending: {pendingCount}</div>
                )}

              </div>

              <button onClick={()=>setPanelOpen(false)}>
                Close
              </button>

            </div>

            <hr/>

            {loadingDay
              ? "Loading..."
              : dayReservations.map(r => (

                <div key={r.id} style={{marginBottom:10}}>

                  {r.start_time.slice(0,5)} - {r.end_time.slice(0,5)}

                  <div>Status: {r.status}</div>

                  {isAdmin && r.status==="pending" && (

                    <div style={{display:"flex",gap:8}}>

                      <button
                        onClick={()=>handleSetStatus(r.id,"approved")}
                      >
                        Approve
                      </button>

                      <button
                        onClick={()=>handleSetStatus(r.id,"rejected")}
                      >
                        Reject
                      </button>

                    </div>

                  )}

                </div>

            ))}

            <hr/>

            <div>

              <input
                type="time"
                value={startTime}
                onChange={e=>setStartTime(e.target.value)}
              />

              <input
                type="time"
                value={endTime}
                onChange={e=>setEndTime(e.target.value)}
              />

              <button onClick={submitReservation}>
                Reserve
              </button>

              {message && <div>{message}</div>}

            </div>

          </div>

        )}

      </div>

      {reserveModalOpen && (

      <div className="modalOverlay">

        <div className="modalBox">

          <h3>Reserve Room</h3>

          <div>Date: {selectedDate}</div>

          <div style={{marginTop:10}}>

            <label>Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e)=>setStartTime(e.target.value)}
            />

          </div>

          <div>

            <label>End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e)=>setEndTime(e.target.value)}
            />

          </div>

          <div style={{marginTop:20,display:"flex",gap:10}}>

            <button onClick={()=>setReserveModalOpen(false)}>
              Cancel
            </button>

            <button onClick={submitReservation}>
              Confirm Reservation
            </button>

          </div>

        </div>

      </div>

    )}

    </div>

  );

  

}