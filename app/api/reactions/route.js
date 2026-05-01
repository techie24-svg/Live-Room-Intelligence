import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

const VALID_TYPES = new Set(['engaged', 'neutral', 'lost']);

async function ensureRoom(roomCode) {
  await sql`INSERT INTO rooms (code) VALUES (${roomCode}) ON CONFLICT (code) DO NOTHING`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const type = String(body.type || '').toLowerCase();

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!VALID_TYPES.has(type)) return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });

    await ensureRoom(roomCode);
    await sql`INSERT INTO reactions (room_code, type) VALUES (${roomCode}, ${type})`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = cleanRoomCode(searchParams.get('roomCode'));
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    await ensureRoom(roomCode);

    const rows = await sql`
      SELECT type, COUNT(*)::int AS count
      FROM reactions
      WHERE room_code = ${roomCode}
      GROUP BY type
    `;

    const recent = await sql`
      SELECT type, COUNT(*)::int AS count
      FROM reactions
      WHERE room_code = ${roomCode}
      AND created_at >= NOW() - INTERVAL '30 seconds'
      GROUP BY type
    `;

    const totals = { engaged: 0, neutral: 0, lost: 0 };
    const recentTotals = { engaged: 0, neutral: 0, lost: 0 };
    rows.forEach((r) => { totals[r.type] = r.count; });
    recent.forEach((r) => { recentTotals[r.type] = r.count; });

    return NextResponse.json({ totals, recent: recentTotals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
