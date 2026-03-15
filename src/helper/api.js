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

// --------------------
// INVENTORY (ITEMS)
// --------------------
export async function getItems({ q, category } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", String(q));
  if (category) params.set("category", String(category));

  const url = params.toString() ? `${API_BASE}/api/items?${params}` : `${API_BASE}/api/items`;

  const res = await fetch(url);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to load items");
  return Array.isArray(data) ? data : [];
}

export async function createItem({ item_code, item_name, category, quantity }) {
  const res = await fetch(`${API_BASE}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_code, item_name, category, quantity }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to create item");
  return data;
}

export async function updateItem(id, { item_code, item_name, category, quantity }) {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_code, item_name, category, quantity }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to update item");
  return data;
}

export async function deleteItem(id) {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "DELETE",
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to delete item");
  return data;
}

// --------------------
// BORROW REQUESTS
// --------------------
export async function createBorrowRequest({ student_id, borrow_date, return_date, items }) {
  const res = await fetch(`${API_BASE}/api/borrow-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id, borrow_date, return_date, items }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) {
    const base = data?.error || "Failed to create borrow request";
    const details = data?.details ? ` (${data.details})` : "";
    const code = data?.code ? ` [${data.code}]` : "";
    throw new Error(`${base}${details}${code}`);
  }
  return data;
}

export async function getBorrowRequests({ student_id } = {}) {
  const params = new URLSearchParams();
  if (student_id) params.set("student_id", String(student_id));

  const url = params.toString()
    ? `${API_BASE}/api/borrow-requests?${params}`
    : `${API_BASE}/api/borrow-requests`;

  const res = await fetch(url);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to load borrow requests");
  return Array.isArray(data) ? data : [];
}

export async function getBorrowRequestItems(id) {
  const res = await fetch(`${API_BASE}/api/borrow-requests/${id}/items`);
  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to load borrow request items");
  return Array.isArray(data) ? data : [];
}

export async function setBorrowRequestStatus(id, { status, user_id }) {
  const res = await fetch(`${API_BASE}/api/borrow-requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, user_id }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to update borrow request status");
  return data;
}

export async function returnBorrowRequest(id, { user_id, condition_notes }) {
  const res = await fetch(`${API_BASE}/api/borrow-requests/${id}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, condition_notes }),
  });

  const { ok, data } = await parseJson(res);
  if (!ok) throw new Error(data?.error || "Failed to mark returned");
  return data;
}