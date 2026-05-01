import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(req, bodySecret) {
  const configuredSecret = process.env.SETUP_SECRET;
  if (!configuredSecret) return true;
  const headerSecret = req.headers.get("x-setup-secret");
  return headerSecret === configuredSecret || bodySecret === configuredSecret;
}

async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reactions (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('engaged', 'neutral', 'lost')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS summaries (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      result JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ ok: false, error: "Invalid setup secret" }, { status: 401 });
    }

    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (_) {}

    if (!isAuthorized(req, body.secret)) {
      return NextResponse.json({ ok: false, error: "Invalid setup secret" }, { status: 401 });
    }

    await createTables();
    return NextResponse.json({ ok: true, message: "Database tables are ready." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
