import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const VALID_TYPES = new Set(['engaged', 'neutral', 'lost']);

async function ensureRoom(sql, roomCode) {
  await sql`INSERT INTO rooms (code) VALUES (${roomCode}) ON CONFLICT (code) DO NOTHING`;
}

async function getRoom(sql, roomCode) {
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;
  const rows = await sql`SELECT ended_at FROM rooms WHERE code = ${roomCode} LIMIT 1`;
  return rows[0] || null;
}

function cleanSessionId(value) {
  const sessionId = String(value || '').trim();
  if (!sessionId) return '';
  return sessionId.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 120);
}

async function ensureReactionSessionSchema(sql) {
  await sql`ALTER TABLE reactions ADD COLUMN IF NOT EXISTS session_id TEXT`;
  await sql`UPDATE reactions SET session_id = 'legacy-' || id::text WHERE session_id IS NULL`;
  await sql`ALTER TABLE reactions ALTER COLUMN session_id SET NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS reactions_room_session_unique ON reactions(room_code, session_id)`;
}

export async function POST(req) {
  try {
    const sql = getSql();
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const type = String(body.type || '').toLowerCase();
    const sessionId = cleanSessionId(body.sessionId);

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!VALID_TYPES.has(type)) return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });

    await ensureRoom(sql, roomCode);
    const room = await getRoom(sql, roomCode);
    if (room?.ended_at) return NextResponse.json({ error: 'This session has ended' }, { status: 410 });
    await ensureReactionSessionSchema(sql);

    await sql`
      INSERT INTO reactions (room_code, type, session_id)
      VALUES (${roomCode}, ${type}, ${sessionId})
      ON CONFLICT (room_code, session_id)
      DO UPDATE SET type = EXCLUDED.type, created_at = NOW()
    `;

    return NextResponse.json({ ok: true });
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

    const rows = await sql`SELECT type, COUNT(*)::int AS count FROM reactions WHERE room_code = ${roomCode} GROUP BY type`;
    const recent = await sql`SELECT type, COUNT(*)::int AS count FROM reactions WHERE room_code = ${roomCode} AND created_at >= NOW() - INTERVAL '30 seconds' GROUP BY type`;
    const totals = { engaged: 0, neutral: 0, lost: 0 };
    const recentTotals = { engaged: 0, neutral: 0, lost: 0 };
    rows.forEach((r) => { totals[r.type] = r.count; });
    recent.forEach((r) => { recentTotals[r.type] = r.count; });
    return NextResponse.json({ totals, recent: recentTotals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
