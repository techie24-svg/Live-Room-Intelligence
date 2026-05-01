import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const sql = getSql();
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const title = String(body.title || 'Live Session').trim().slice(0, 120) || 'Live Session';

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
