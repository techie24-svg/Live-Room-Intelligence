import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function cleanPin(value) {
  return String(value || '').trim().replace(/\D/g, '').slice(0, 12);
}

export async function POST(req) {
  try {
    const sql = getSql();
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const hostPin = cleanPin(body.hostPin);

    if (!roomCode) return NextResponse.json({ ok: false, error: 'roomCode is required' }, { status: 400 });
    if (!hostPin) return NextResponse.json({ ok: false, error: 'Host PIN is required' }, { status: 400 });

    await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
    const rows = await sql`SELECT host_pin FROM rooms WHERE code = ${roomCode} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 });

    const expectedPin = rows[0].host_pin;
    if (expectedPin && expectedPin !== hostPin) {
      return NextResponse.json({ ok: false, error: 'Incorrect host PIN' }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
