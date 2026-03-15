// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Startup DB check: proves which DB you are connected to
async function checkDb() {
  try {
    const r = await pool.query(`
      SELECT
        current_database() AS db,
        current_user AS user,
        inet_server_addr()::text AS server_ip,
        inet_server_port() AS server_port,
        current_schema() AS schema
    `);
    console.log("✅ Connected to Postgres:", r.rows[0]);
  } catch (err) {
    console.error("❌ DB connection check failed:", err);
  }
}
checkDb();

// --------------------
// HELPERS
// --------------------
async function ensureRolesExist() {
  await pool.query(`
    INSERT INTO public.roles (name)
    VALUES ('admin'), ('student')
    ON CONFLICT (name) DO NOTHING;
  `);
}

async function getRoleIdByName(roleName) {
  const r = await pool.query(
    `SELECT id FROM public.roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [roleName]
  );
  return r.rows[0]?.id || null;
}

// --------------------
// ✅ AUTH ROUTES
// --------------------

// Register new user
// Default role = student
// Admin registration is allowed ONLY if admin_secret matches ADMIN_REGISTER_SECRET
app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role, admin_secret, school_id } = req.body;

    if (!full_name || !email || !password || !school_id) {
      return res.status(400).json({
        error: "full_name, email, password, and school_id are required",
      });
    }

    const identifier = String(email).trim();
    const normalizedEmail = identifier.toLowerCase();

    // Make sure roles exist
    await ensureRolesExist();

    // Check email exists
    const exists = await pool.query(
      `SELECT 1 FROM public.users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Decide role (safe)
    let desiredRole = String(role || "student").trim().toLowerCase();

    if (desiredRole === "admin") {
      const secret = String(process.env.ADMIN_REGISTER_SECRET || "").trim();

      // If you didn't set ADMIN_REGISTER_SECRET, admin registration is disabled
      if (!secret) {
        return res.status(403).json({
          error: "Admin signup disabled. Set ADMIN_REGISTER_SECRET in backend env.",
        });
      }

      if (String(admin_secret || "").trim() !== secret) {
        return res.status(403).json({ error: "Invalid admin passcode." });
      }
    } else {
      desiredRole = "student";
    }

    const roleId = await getRoleIdByName(desiredRole);

    if (!roleId) {
      const roles = await pool.query(
        `SELECT id, name FROM public.roles ORDER BY id`
      );
      return res.status(500).json({
        error: `${desiredRole} role not found in roles table.`,
        rolesFound: roles.rows,
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const inserted = await pool.query(
      `
      INSERT INTO public.users (full_name, email, password_hash, role_id, school_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, school_id
      `,
      [full_name, normalizedEmail, password_hash, roleId, school_id]
    );

    // ✅ Return role string too
    return res.status(201).json({
      ...inserted.rows[0],
      role: desiredRole,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to register",
      code: err.code,
      details: err.message,
    });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const identifier = String(email).trim();
    const normalizedEmail = identifier.toLowerCase();

    const result = await pool.query(
      `
      SELECT u.id, u.full_name, u.email, u.password_hash, u.school_id, r.name AS role
      FROM public.users u
      LEFT JOIN public.roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = $1 OR u.school_id = $2
      LIMIT 1
      `,
      [normalizedEmail, identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      school_id: user.school_id,
      role: String(user.role || "student").toLowerCase(),
    });
  } catch (err) {
    console.error("Login error:", err.message, err.code);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// --------------------
// ✅ HEALTH CHECK
// --------------------
app.get("/api/health", async (req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

// --------------------
// ✅ LAB ROOMS
// --------------------
app.get("/api/lab-rooms", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, room_code, room_name, capacity
       FROM public.lab_rooms
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB error in GET /api/lab-rooms:", err.message, err.code);
    res.status(500).json({
      error: "Failed to fetch lab rooms",
      details: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// --------------------
// ✅ ROOM RESERVATIONS
// --------------------

// Calendar events (approved only)
app.get("/api/room-reservations/events", async (req, res) => {
  try {
    const { start, end, roomId } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "start and end are required" });
    }

    const roomIdNum = roomId ? Number(roomId) : null;

    const result = await pool.query(
      `
      SELECT
        rr.id,
        lr.room_name AS title,
        (rr.reservation_date::timestamp + rr.start_time) AS start,
        (rr.reservation_date::timestamp + rr.end_time)   AS "end",
        rr.lab_room_id,
        rr.status
      FROM public.room_reservations rr
      JOIN public.lab_rooms lr ON rr.lab_room_id = lr.id
      WHERE rr.status = 'approved'
        AND rr.reservation_date BETWEEN $1::date AND $2::date
        AND ($3::int IS NULL OR rr.lab_room_id = $3::int)
      ORDER BY start
      `,
      [start, end, roomIdNum]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(
      "DB error in GET /api/room-reservations/events:",
      err.message,
      err.code
    );
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Side panel: reservations for a room + date (includes pending/approved/etc)
app.get("/api/lab-rooms/:roomId/reservations", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    }

    const result = await pool.query(
      `
      SELECT id, start_time, end_time, status, reserved_by
      FROM public.room_reservations
      WHERE lab_room_id = $1
        AND reservation_date = $2::date
      ORDER BY start_time
      `,
      [roomId, date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(
      "DB error in GET /api/lab-rooms/:roomId/reservations:",
      err.message,
      err.code
    );
    res.status(500).json({ error: "Failed to fetch reservations for date" });
  }
});

// Create reservation (pending)
app.post("/api/lab-rooms/:roomId/reservations", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { reserved_by, reservation_date, start_time, end_time } = req.body;

    if (!reserved_by || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({
        error: "reserved_by, reservation_date, start_time, end_time are required",
      });
    }

    const reservedByNum = Number(reserved_by);

    if (!Number.isInteger(reservedByNum) || reservedByNum <= 0) {
      return res
        .status(400)
        .json({ error: "reserved_by must be a valid integer user id" });
    }

    if (start_time >= end_time) {
      return res
        .status(400)
        .json({ error: "start_time must be before end_time" });
    }

    // Conflict check (approved only)
    const conflict = await pool.query(
      `
      SELECT 1
      FROM public.room_reservations
      WHERE lab_room_id = $1
        AND reservation_date = $2::date
        AND status = 'approved'
        AND (start_time < $4::time AND end_time > $3::time)
      LIMIT 1
      `,
      [roomId, reservation_date, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: "Time slot is already reserved" });
    }

    const inserted = await pool.query(
      `
      INSERT INTO public.room_reservations
      (lab_room_id, reserved_by, reservation_date, start_time, end_time, status)
      VALUES ($1, $2, $3::date, $4::time, $5::time, 'pending')
      RETURNING *
      `,
      [roomId, reservedByNum, reservation_date, start_time, end_time]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error(
      "DB error in POST /api/lab-rooms/:roomId/reservations:",
      err.message,
      err.code
    );
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

// Admin: approve/reject/cancel/pending
app.patch("/api/room-reservations/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["approved", "rejected", "cancelled", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await pool.query(
      `
      UPDATE public.room_reservations
      SET status = $2
      WHERE id = $1
      RETURNING *
      `,
      [id, status]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(
      "DB error in PATCH /api/room-reservations/:id/status:",
      err.message,
      err.code
    );
    res.status(500).json({ error: "Failed to update status" });
  }
});

// --------------------
// ✅ ADMIN DASHBOARD ROUTES (NEW)
// --------------------

// Admin stats (counts from DB)
app.get("/api/admin/stats", async (req, res) => {
  try {
    const reservations = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int AS pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::int AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::int AS rejected,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled
      FROM public.room_reservations
    `);

    res.json({ reservations: reservations.rows[0] });
  } catch (err) {
    console.error("Admin stats error:", err.message, err.code);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

// Admin list of room reservations (filter by status)
app.get("/api/admin/room-reservations", async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status).toLowerCase() : null;

    const allowed = ["pending", "approved", "rejected", "cancelled"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }

    const result = await pool.query(
      `
      SELECT
        rr.id,
        rr.lab_room_id,
        lr.room_name,
        rr.reservation_date,
        rr.start_time,
        rr.end_time,
        rr.status,
        rr.reserved_by,
        u.full_name AS reserved_by_name
      FROM public.room_reservations rr
      JOIN public.lab_rooms lr ON rr.lab_room_id = lr.id
      LEFT JOIN public.users u ON rr.reserved_by = u.id
      WHERE ($1::text IS NULL OR rr.status = $1::text)
      ORDER BY rr.reservation_date DESC, rr.start_time DESC
      LIMIT 200
      `,
      [status]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Admin reservations list error:", err.message, err.code);
    res.status(500).json({ error: "Failed to load reservations list" });
  }
});

// --------------------
// ✅ INVENTORY + BORROWING
// --------------------

// List items (shared: admin + student)
app.get("/api/items", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : "";
    const category = req.query.category ? String(req.query.category).trim() : "";

    const result = await pool.query(
      `
      SELECT id, item_code, item_name, category, quantity, created_at
      FROM public.items
      WHERE ($1::text = '' OR item_name ILIKE '%' || $1 || '%' OR item_code ILIKE '%' || $1 || '%')
        AND ($2::text = '' OR category = $2::text)
      ORDER BY created_at DESC, id DESC
      LIMIT 500
      `,
      [q, category]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Items list error:", err.message, err.code);
    res.status(500).json({ error: "Failed to load items" });
  }
});

// Admin: create item
app.post("/api/items", async (req, res) => {
  try {
    const { item_code, item_name, category, quantity } = req.body;

    if (!item_code || !item_name) {
      return res
        .status(400)
        .json({ error: "item_code and item_name are required" });
    }

    const qtyNum = Number(quantity ?? 0);
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      return res.status(400).json({ error: "quantity must be >= 0" });
    }

    const inserted = await pool.query(
      `
      INSERT INTO public.items (item_code, item_name, category, quantity)
      VALUES ($1, $2, $3, $4)
      RETURNING id, item_code, item_name, category, quantity, created_at
      `,
      [String(item_code).trim(), String(item_name).trim(), category || null, qtyNum]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error("Create item error:", err.message, err.code);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Admin: update item
app.put("/api/items/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { item_code, item_name, category, quantity } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const qtyNum = quantity === undefined ? undefined : Number(quantity);
    if (qtyNum !== undefined && (!Number.isFinite(qtyNum) || qtyNum < 0)) {
      return res.status(400).json({ error: "quantity must be >= 0" });
    }

    const updated = await pool.query(
      `
      UPDATE public.items
      SET
        item_code = COALESCE($2::text, item_code),
        item_name = COALESCE($3::text, item_name),
        category  = COALESCE($4::text, category),
        quantity  = COALESCE($5::int, quantity)
      WHERE id = $1
      RETURNING id, item_code, item_name, category, quantity, created_at
      `,
      [
        id,
        item_code === undefined ? null : String(item_code).trim(),
        item_name === undefined ? null : String(item_name).trim(),
        category === undefined ? null : category,
        qtyNum === undefined ? null : qtyNum,
      ]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("Update item error:", err.message, err.code);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Admin: delete item
app.delete("/api/items/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const deleted = await pool.query(
      `DELETE FROM public.items WHERE id = $1 RETURNING id`,
      [id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ ok: true, id });
  } catch (err) {
    console.error("Delete item error:", err.message, err.code);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Student: create borrow request (status=pending)
// Body: { student_id, borrow_date?, return_date?, items: [{item_id, quantity}] }
app.post("/api/borrow-requests", async (req, res) => {
  const client = await pool.connect();
  try {
    const { student_id, borrow_date, return_date, items } = req.body;

    const studentIdNum = Number(student_id);
    if (!Number.isInteger(studentIdNum) || studentIdNum <= 0) {
      return res.status(400).json({ error: "student_id must be a valid integer" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items is required" });
    }

    const normalizedItems = items
      .map((it) => ({
        item_id: Number(it.item_id),
        quantity: Number(it.quantity),
      }))
      .filter((it) => Number.isInteger(it.item_id) && it.item_id > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ error: "items must include valid item_id" });
    }

    for (const it of normalizedItems) {
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        return res
          .status(400)
          .json({ error: "Each item quantity must be > 0" });
      }
    }

    await client.query("BEGIN");

    // Validate items exist and (soft) check availability at request time
    // Note: quantity is decremented on approval, not on request create.
    const itemIds = normalizedItems.map((x) => x.item_id);
    const existing = await client.query(
      `SELECT id, quantity FROM public.items WHERE id = ANY($1::int[])`,
      [itemIds]
    );
    const byId = new Map(existing.rows.map((r) => [r.id, r]));

    for (const it of normalizedItems) {
      const row = byId.get(it.item_id);
      if (!row) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `Item not found: ${it.item_id}` });
      }
      if (it.quantity > Number(row.quantity || 0)) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: `Not enough stock for item ${it.item_id}` });
      }
    }

    const insertedReq = await client.query(
      `
      INSERT INTO public.borrow_requests (student_id, status, borrow_date, return_date)
      VALUES (
        $1,
        'pending',
        COALESCE($2::date, CURRENT_DATE),
        COALESCE($3::date, COALESCE($2::date, CURRENT_DATE))
      )
      RETURNING id, student_id, status, borrow_date, return_date, created_at
      `,
      [studentIdNum, borrow_date || null, return_date || null]
    );

    const borrowRequestId = insertedReq.rows[0].id;

    for (const it of normalizedItems) {
      await client.query(
        `
        INSERT INTO public.borrow_items (borrow_request_id, item_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [borrowRequestId, it.item_id, it.quantity]
      );
    }

    await client.query(
      `
      INSERT INTO public.inventory_logs (user_id, action, item_id, quantity, action_date)
      SELECT $1::int, 'borrow_request_created', bi.item_id, bi.quantity, NOW()
      FROM public.borrow_items bi
      WHERE bi.borrow_request_id = $2
      `,
      [studentIdNum, borrowRequestId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      ...insertedReq.rows[0],
      items: normalizedItems,
    });
  } catch (err) {
    console.error("Create borrow request error body:", req.body);
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error("Create borrow request error:", err.message, err.code);
    res.status(500).json({
      error: "Failed to create borrow request",
      details: err.message,
      code: err.code,
    });
  } finally {
    client.release();
  }
});

// Student/Admin: list borrow requests (optional filter by student_id)
app.get("/api/borrow-requests", async (req, res) => {
  try {
    const studentId = req.query.student_id ? Number(req.query.student_id) : null;
    if (studentId !== null && (!Number.isInteger(studentId) || studentId <= 0)) {
      return res.status(400).json({ error: "Invalid student_id" });
    }

    const result = await pool.query(
      `
      SELECT
        br.id,
        br.student_id,
        u.school_id AS student_school_id,
        u.full_name AS student_full_name,
        br.status,
        br.borrow_date,
        br.return_date,
        br.created_at
      FROM public.borrow_requests br
      LEFT JOIN public.users u ON br.student_id = u.id
      WHERE ($1::int IS NULL OR br.student_id = $1::int)
      ORDER BY br.created_at DESC, br.id DESC
      LIMIT 200
      `,
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Borrow requests list error:", err.message, err.code);
    res.status(500).json({ error: "Failed to load borrow requests" });
  }
});

// Borrow request items (join borrow_items -> items)
app.get("/api/borrow-requests/:id/items", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid borrow request id" });
    }

    const result = await pool.query(
      `
      SELECT
        bi.id,
        bi.borrow_request_id,
        bi.item_id,
        bi.quantity,
        i.item_code,
        i.item_name,
        i.category
      FROM public.borrow_items bi
      JOIN public.items i ON bi.item_id = i.id
      WHERE bi.borrow_request_id = $1
      ORDER BY bi.id
      `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Borrow request items error:", err.message, err.code);
    res.status(500).json({ error: "Failed to load borrow request items" });
  }
});

// Admin: approve/reject a borrow request
// Body: { status: 'approved' | 'rejected', user_id }
// On approval: decrement items.quantity and log it.
app.patch("/api/borrow-requests/:id/status", async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { status, user_id } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid borrow request id" });
    }

    const statusLower = String(status || "").toLowerCase();
    if (!['approved', 'rejected'].includes(statusLower)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const actorId = Number(user_id);
    if (!Number.isInteger(actorId) || actorId <= 0) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await client.query("BEGIN");

    const reqRow = await client.query(
      `SELECT id, status FROM public.borrow_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (reqRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Borrow request not found" });
    }

    const currentStatus = String(reqRow.rows[0].status || '').toLowerCase();
    if (currentStatus !== 'pending') {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Cannot update status from ${currentStatus}` });
    }

    if (statusLower === 'approved') {
      // Load requested items
      const itemsRes = await client.query(
        `SELECT item_id, quantity FROM public.borrow_items WHERE borrow_request_id = $1`,
        [id]
      );

      if (itemsRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Borrow request has no items" });
      }

      // Lock items and validate availability
      const itemIds = itemsRes.rows.map((r) => r.item_id);
      const locked = await client.query(
        `SELECT id, quantity FROM public.items WHERE id = ANY($1::int[]) FOR UPDATE`,
        [itemIds]
      );
      const byId = new Map(locked.rows.map((r) => [r.id, r]));

      for (const r of itemsRes.rows) {
        const row = byId.get(r.item_id);
        if (!row) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: `Item not found: ${r.item_id}` });
        }
        if (Number(r.quantity) > Number(row.quantity || 0)) {
          await client.query("ROLLBACK");
          return res
            .status(409)
            .json({ error: `Not enough stock for item ${r.item_id}` });
        }
      }

      // Decrement quantities
      for (const r of itemsRes.rows) {
        await client.query(
          `UPDATE public.items SET quantity = quantity - $2 WHERE id = $1`,
          [r.item_id, Number(r.quantity)]
        );
      }

      await client.query(
        `
        INSERT INTO public.inventory_logs (user_id, action, item_id, quantity, action_date)
        SELECT $1::int, 'borrow_approved', bi.item_id, bi.quantity, NOW()
        FROM public.borrow_items bi
        WHERE bi.borrow_request_id = $2
        `,
        [actorId, id]
      );
    } else {
      await client.query(
        `
        INSERT INTO public.inventory_logs (user_id, action, item_id, quantity, action_date)
        SELECT $1::int, 'borrow_rejected', bi.item_id, bi.quantity, NOW()
        FROM public.borrow_items bi
        WHERE bi.borrow_request_id = $2
        `,
        [actorId, id]
      );
    }

    const updated = await client.query(
      `
      UPDATE public.borrow_requests
      SET status = $2
      WHERE id = $1
      RETURNING id, student_id, status, borrow_date, return_date, created_at
      `,
      [id, statusLower]
    );

    await client.query("COMMIT");
    res.json(updated.rows[0]);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error("Update borrow request status error:", err.message, err.code);
    res.status(500).json({ error: "Failed to update borrow request status" });
  } finally {
    client.release();
  }
});

// Admin: mark returned
// Body: { user_id, condition_notes? }
// Behavior: increments item quantities back, inserts into returns, sets borrow_requests.status='returned'
app.post("/api/borrow-requests/:id/return", async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { user_id, condition_notes } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid borrow request id" });
    }

    const actorId = Number(user_id);
    if (!Number.isInteger(actorId) || actorId <= 0) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await client.query("BEGIN");

    const reqRow = await client.query(
      `SELECT id, status FROM public.borrow_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (reqRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Borrow request not found" });
    }

    const currentStatus = String(reqRow.rows[0].status || '').toLowerCase();
    if (currentStatus !== 'approved') {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Only approved requests can be returned (current: ${currentStatus})` });
    }

    const itemsRes = await client.query(
      `SELECT item_id, quantity FROM public.borrow_items WHERE borrow_request_id = $1`,
      [id]
    );
    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Borrow request has no items" });
    }

    const itemIds = itemsRes.rows.map((r) => r.item_id);
    await client.query(
      `SELECT id FROM public.items WHERE id = ANY($1::int[]) FOR UPDATE`,
      [itemIds]
    );

    for (const r of itemsRes.rows) {
      await client.query(
        `UPDATE public.items SET quantity = quantity + $2 WHERE id = $1`,
        [r.item_id, Number(r.quantity)]
      );
    }

    await client.query(
      `
      INSERT INTO public.returns (borrow_request_id, returned_at, condition_notes)
      VALUES ($1, NOW(), $2)
      `,
      [id, condition_notes || null]
    );

    await client.query(
      `
      INSERT INTO public.inventory_logs (user_id, action, item_id, quantity, action_date)
      SELECT $1::int, 'borrow_returned', bi.item_id, bi.quantity, NOW()
      FROM public.borrow_items bi
      WHERE bi.borrow_request_id = $2
      `,
      [actorId, id]
    );

    const updated = await client.query(
      `
      UPDATE public.borrow_requests
      SET status = 'returned'
      WHERE id = $1
      RETURNING id, student_id, status, borrow_date, return_date, created_at
      `,
      [id]
    );

    await client.query("COMMIT");
    res.json({ ok: true, request: updated.rows[0] });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error("Return borrow request error:", err.message, err.code);
    res.status(500).json({ error: "Failed to mark returned" });
  } finally {
    client.release();
  }
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));