const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

async function parseJson(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  return { ok: res.ok, status: res.status, data };
}

// --------------------
// LAB ROOMS
// --------------------
export async function getLabRooms() {
  const res = await fetch(`${API_BASE}/api/lab-rooms`);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to fetch lab rooms");
  return Array.isArray(data) ? data : [];
}

export async function getEvents({ start, end, roomId }) {
  const params = new URLSearchParams();
  params.set("start", start);
  params.set("end", end);
  if (roomId) params.set("roomId", String(roomId));

  const res = await fetch(`${API_BASE}/api/room-reservations/events?${params}`);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to fetch events");
  return Array.isArray(data) ? data : [];
}

export async function getRoomReservationsByDate({ roomId, date }) {
  const res = await fetch(
    `${API_BASE}/api/lab-rooms/${roomId}/reservations?date=${date}`
  );
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to fetch reservations");
  return Array.isArray(data) ? data : [];
}

export async function createReservation({
  roomId,
  reserved_by,
  reservation_date,
  start_time,
  end_time,
}) {
  const res = await fetch(`${API_BASE}/api/lab-rooms/${roomId}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reserved_by,
      reservation_date,
      start_time,
      end_time,
    }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Reservation failed");
  return data;
}

// --------------------
// AUTH
// --------------------
export async function apiRegister({ full_name, email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Registration failed");
  return data; // {id, full_name, email, role_id...}
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Login failed");
  return data; // {id, full_name, email, role}
}
