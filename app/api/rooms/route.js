import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function cleanPin(value) {
  return String(value || '').trim().replace(/\D/g, '').slice(0, 12);
}

async function ensureRoomsSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'FeelPulse Session',
      host_pin TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'FeelPulse Session'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
}

export async function POST(req) {
  try {
    const sql = getSql();
    await ensureRoomsSchema(sql);

    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const title = String(body.title || 'FeelPulse Session').trim().slice(0, 120) || 'FeelPulse Session';
    const hostPin = cleanPin(body.hostPin);

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!/^\d{4,12}$/.test(hostPin)) return NextResponse.json({ error: 'Host PIN must be 4 to 12 numbers' }, { status: 400 });

    const rows = await sql`
      INSERT INTO rooms (code, title, host_pin)
      VALUES (${roomCode}, ${title}, ${hostPin})
      ON CONFLICT (code) DO NOTHING
      RETURNING code, title, host_pin, created_at
    `;

    if (!rows.length) return NextResponse.json({ error: 'Room code already exists' }, { status: 409 });

    return NextResponse.json({ ok: true, room: { code: rows[0].code, title: rows[0].title, created_at: rows[0].created_at }, hostPin });
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
