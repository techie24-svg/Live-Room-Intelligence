// pages/api/setup.js

import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { secret } = req.body;

    if (!process.env.SETUP_SECRET) {
      return res.status(500).json({
        ok: false,
        error: "SETUP_SECRET not set in env",
      });
    }

    if (secret !== process.env.SETUP_SECRET) {
      return res.status(401).json({
        ok: false,
        error: "Invalid setup secret",
      });
    }

    // Create tables
    await sql(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT DEFAULT 'Townhall',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS summaries (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        summary JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed demo room
    await sql(
      `
      INSERT INTO rooms (code, title)
      VALUES ($1, $2)
      ON CONFLICT (code) DO NOTHING;
      `,
      ["townhall-demo", "Townhall Demo"]
    );

    return res.status(200).json({
      ok: true,
      message: "Database setup complete",
    });
  } catch (err) {
    console.error("SETUP ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
