// lib/db.js

import { Pool } from "pg";

// Create a single pool instance (safe for serverless)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
});

// Simple query helper
export async function sql(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("DB ERROR:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Optional: health check
export async function dbHealth() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (e) {
    console.error("DB health failed:", e);
    return false;
  }
}
