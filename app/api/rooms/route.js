import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function makeHostPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function ensureRoomsSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
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
    const hostPin = String(body.hostPin || makeHostPin()).replace(/\D/g, '').slice(0, 12) || makeHostPin();

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    const rows = await sql`
      INSERT INTO rooms (code, title, host_pin)
      VALUES (${roomCode}, ${title}, ${hostPin})
      ON CONFLICT (code) DO NOTHING
      RETURNING code, title, host_pin, created_at
    `;

    if (!rows.length) return NextResponse.json({ error: 'Room code already exists' }, { status: 409 });

    return NextResponse.json({
      ok: true,
      room: {
        code: rows[0].code,
        title: rows[0].title,
        created_at: rows[0].created_at,
      },
      hostPin: rows[0].host_pin,
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
    const hostPin = String(searchParams.get('hostPin') || '').trim();
    const verifyHost = searchParams.get('host') === '1';

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    const rows = await sql`SELECT code, title, host_pin, created_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    if (verifyHost) {
      if (!rows[0].host_pin || rows[0].host_pin !== hostPin) {
        return NextResponse.json({ error: 'Invalid host PIN' }, { status: 403 });
      }
      return NextResponse.json({ ok: true, host: true, room: { code: rows[0].code, title: rows[0].title, created_at: rows[0].created_at } });
    }

    return NextResponse.json({ ok: true, room: { code: rows[0].code, title: rows[0].title, created_at: rows[0].created_at } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
