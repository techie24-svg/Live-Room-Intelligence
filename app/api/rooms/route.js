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
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'FeelPulse Session'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
}

export async function POST(req) {
  try {
    const sql = getSql();
    await ensureRoomsSchema(sql);

    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const title =
      String(body.title || 'FeelPulse Session').trim().slice(0, 120) ||
      'FeelPulse Session';
    const hostPin = cleanPin(body.hostPin);

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    if (!/^\d{4,12}$/.test(hostPin)) {
      return NextResponse.json(
        { error: 'Host PIN must be 4 to 12 numbers' },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO rooms (code, title, host_pin, is_active, ended_at)
      VALUES (${roomCode}, ${title}, ${hostPin}, TRUE, NULL)
      ON CONFLICT (code) DO NOTHING
      RETURNING code, title, is_active, ended_at, created_at
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: 'Room code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      room: rows[0],
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

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT code, title, is_active, ended_at, created_at
      FROM rooms
      WHERE code = ${roomCode}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      room: {
        ...rows[0],
        ended: rows[0].is_active === false || Boolean(rows[0].ended_at),
      },
    });
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
    const action = String(body.action || '').trim().toLowerCase();

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    if (!hostPin) {
      return NextResponse.json({ error: 'hostPin is required' }, { status: 400 });
    }

    if (action !== 'end') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE rooms
      SET is_active = FALSE,
          ended_at = COALESCE(ended_at, NOW())
      WHERE code = ${roomCode}
        AND host_pin = ${hostPin}
      RETURNING code, title, is_active, ended_at, created_at
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: 'Invalid room or host PIN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      room: {
        ...rows[0],
        ended: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
