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
export async function apiRegister({
  full_name,
  email,
  password,
  role,
  admin_secret,
  school_id,
  ...extraFields
}) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name,
      email,
      password,
      role,
      admin_secret,
      school_id,
      ...extraFields,
    }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Registration failed");
  return data;
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Login failed");
  return data;
}

// --------------------
// ADMIN: UPDATE RESERVATION STATUS
// --------------------
export async function updateReservationStatus({ id, status }) {
  const res = await fetch(`${API_BASE}/api/room-reservations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to update status");
  return data;
}

// --------------------
// ✅ ADMIN DASHBOARD APIs (NEW)
// --------------------
export async function getAdminStats() {
  const res = await fetch(`${API_BASE}/api/admin/stats`);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to fetch admin stats");
  return data; // { reservations: {total,pending,approved,rejected,cancelled} }
}

export async function getAdminRoomReservations({ status } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const url = params.toString()
    ? `${API_BASE}/api/admin/room-reservations?${params}`
    : `${API_BASE}/api/admin/room-reservations`;

  const res = await fetch(url);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to fetch reservations list");
  return Array.isArray(data) ? data : [];
}