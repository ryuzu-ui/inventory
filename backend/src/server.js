const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/api/health", async (req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

// ✅ 1) Get lab rooms
app.get("/api/lab-rooms", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, room_code, room_name, capacity
       FROM lab_rooms
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lab rooms" });
  }
});

// ✅ 2) Get calendar events (approved reservations)
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
      FROM room_reservations rr
      JOIN lab_rooms lr ON rr.lab_room_id = lr.id
      WHERE rr.status = 'approved'
        AND rr.reservation_date BETWEEN $1::date AND $2::date
        AND ($3::int IS NULL OR rr.lab_room_id = $3::int)
      ORDER BY start
      `,
      [start, end, roomIdNum]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ✅ 3) Side panel: reservations for a room + date
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
      FROM room_reservations
      WHERE lab_room_id = $1
        AND reservation_date = $2::date
      ORDER BY start_time
      `,
      [roomId, date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reservations for date" });
  }
});

// ✅ 4) Create reservation (pending) — FIXED reserved_by
app.post("/api/lab-rooms/:roomId/reservations", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { reserved_by, reservation_date, start_time, end_time } = req.body;

    // Validate presence
    if (!reserved_by || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({
        error: "reserved_by, reservation_date, start_time, end_time are required",
      });
    }

    // ✅ FORCE reserved_by to integer
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
      FROM room_reservations
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

    // Insert pending reservation
    const inserted = await pool.query(
      `
      INSERT INTO room_reservations
      (lab_room_id, reserved_by, reservation_date, start_time, end_time, status)
      VALUES ($1, $2, $3::date, $4::time, $5::time, 'pending')
      RETURNING *
      `,
      [roomId, reservedByNum, reservation_date, start_time, end_time]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

// ✅ 5) Admin: approve/reject reservation
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
      UPDATE room_reservations
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
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () =>
  console.log(`API running on http://localhost:${port}`)
);
