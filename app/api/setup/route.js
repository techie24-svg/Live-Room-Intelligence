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
      title TEXT NOT NULL DEFAULT 'FeelPulse Session',
      host_pin TEXT,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'FeelPulse Session'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;

  await sql`
    CREATE TABLE IF NOT EXISTS reactions (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('engaged', 'neutral', 'lost')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE reactions ADD COLUMN IF NOT EXISTS session_id TEXT`;
  await sql`UPDATE reactions SET session_id = 'legacy-' || id::text WHERE session_id IS NULL`;
  await sql`ALTER TABLE reactions ALTER COLUMN session_id SET NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS reactions_room_session_unique ON reactions(room_code, session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reactions_room_created_at ON reactions(room_code, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      text TEXT NOT NULL,
      user_name TEXT,
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_name TEXT`;
  await sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS session_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_questions_room_created_at ON questions(room_code, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_questions_room_session_created_at ON questions(room_code, session_id, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      user_name TEXT NOT NULL DEFAULT 'Anonymous',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS session_id TEXT`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'Anonymous'`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS participants_room_session_unique ON participants(room_code, session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_participants_room_last_seen ON participants(room_code, last_seen_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS summaries (
      id BIGSERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
      result JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_summaries_room_created_at ON summaries(room_code, created_at DESC)`;
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
