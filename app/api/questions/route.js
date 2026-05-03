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
    const text = cleanText(body.text, 700);
    const userName = cleanText(body.userName || 'Anonymous', 80) || 'Anonymous';
    const sessionId = cleanSessionId(body.sessionId);

    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!text || text.length < 3) return NextResponse.json({ error: 'Question is too short' }, { status: 400 });

    await ensureRoom(sql, roomCode);

    const rows = await sql`
      INSERT INTO questions (room_code, text, user_name, session_id)
      VALUES (${roomCode}, ${text}, ${userName}, ${sessionId || null})
      RETURNING id, text, user_name, session_id, created_at
    `;

    return NextResponse.json({ ok: true, question: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(req.url);
    const roomCode = cleanRoomCode(searchParams.get('roomCode'));
    const sessionId = cleanSessionId(searchParams.get('sessionId'));
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    await ensureRoom(sql, roomCode);

    let questions;
    if (sessionId) {
      questions = await sql`
        SELECT id, text, user_name, session_id, created_at
        FROM questions
        WHERE room_code = ${roomCode} AND session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else {
      questions = await sql`
        SELECT id, text, user_name, session_id, created_at
        FROM questions
        WHERE room_code = ${roomCode}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
