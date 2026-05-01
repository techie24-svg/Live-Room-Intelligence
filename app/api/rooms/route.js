import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

async function ensureRoomsSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Older deployments may already have rooms without a title column.
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'FeelPulse Session'`;
}

export async function POST(req) {
  try {
    const sql = getSql();
    await ensureRoomsSchema(sql);

    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const title = String(body.title || 'FeelPulse Session').trim().slice(0, 120) || 'FeelPulse Session';

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    const rows = await sql`
      INSERT INTO rooms (code, title)
      VALUES (${roomCode}, ${title})
      ON CONFLICT (code) DO NOTHING
      RETURNING code, title, created_at
    `;

    if (!rows.length) return NextResponse.json({ error: 'Room code already exists' }, { status: 409 });

    return NextResponse.json({ ok: true, room: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const sql = getSql();
    await ensureRoomsSchema(sql);

    const { searchParams } = new URL(req.url);
    const roomCode = cleanRoomCode(searchParams.get('roomCode'));

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    const rows = await sql`SELECT code, title, created_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    return NextResponse.json({ ok: true, room: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
