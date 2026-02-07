// db.js
const { Pool } = require("pg");
require("dotenv").config();

const isRender = !!process.env.DATABASE_URL;

const pool = new Pool(
  isRender
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Render hosted PG requirement
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

// Helpful: log unexpected pool errors (won’t crash your server)
pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});

module.exports = pool;
