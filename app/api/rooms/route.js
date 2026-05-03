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
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'FeelPulse Session'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;
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
      INSERT INTO rooms (code, title, host_pin, ended_at)
      VALUES (${roomCode}, ${title}, ${hostPin}, NULL)
      ON CONFLICT (code) DO NOTHING
      RETURNING code, title, host_pin, ended_at, created_at
    `;

    if (!rows.length) return NextResponse.json({ error: 'Room code already exists' }, { status: 409 });

    return NextResponse.json({
      ok: true,
      room: { code: rows[0].code, title: rows[0].title, ended_at: rows[0].ended_at, created_at: rows[0].created_at },
      hostPin,
    });
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

    const rows = await sql`SELECT code, title, ended_at, created_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    return NextResponse.json({ ok: true, room: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const sql = getSql();
    await ensureRoomsSchema(sql);

    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const hostPin = cleanPin(body.hostPin);
    const action = String(body.action || '').toLowerCase();

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!hostPin) return NextResponse.json({ error: 'Host PIN is required' }, { status: 400 });
    if (action !== 'end') return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

    const existing = await sql`SELECT host_pin, ended_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
    if (!existing.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const expectedPin = existing[0].host_pin;
    if (expectedPin && expectedPin !== hostPin) {
      return NextResponse.json({ error: 'Incorrect host PIN' }, { status: 403 });
    }

    const rows = await sql`
      UPDATE rooms
      SET ended_at = COALESCE(ended_at, NOW())
      WHERE code = ${roomCode}
      RETURNING code, title, ended_at, created_at
    `;

    return NextResponse.json({ ok: true, room: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
