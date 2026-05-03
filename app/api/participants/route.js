import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode, cleanText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function cleanSessionId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 160);
}

async function ensureRoom(sql, roomCode) {
  await sql`INSERT INTO rooms (code) VALUES (${roomCode}) ON CONFLICT (code) DO NOTHING`;
}

async function getRoom(sql, roomCode) {
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;
  const rows = await sql`SELECT ended_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
  return rows[0] || null;
}

export async function POST(req) {
  try {
    const sql = getSql();
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const sessionId = cleanSessionId(body.sessionId);
    const userName = cleanText(body.userName || 'Anonymous', 80) || 'Anonymous';

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });

    await ensureRoom(sql, roomCode);

    const rows = await sql`
      INSERT INTO participants (room_code, session_id, user_name, joined_at, last_seen_at)
      VALUES (${roomCode}, ${sessionId}, ${userName}, NOW(), NOW())
      ON CONFLICT (room_code, session_id)
      DO UPDATE SET user_name = EXCLUDED.user_name, last_seen_at = NOW()
      RETURNING id, room_code, session_id, user_name, joined_at, last_seen_at
    `;

    return NextResponse.json({ ok: true, participant: rows[0] });
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

    await ensureRoom(sql, roomCode);

    const participants = await sql`
      SELECT user_name, session_id, joined_at, last_seen_at
      FROM participants
      WHERE room_code = ${roomCode}
      ORDER BY last_seen_at DESC
      LIMIT 200
    `;

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
