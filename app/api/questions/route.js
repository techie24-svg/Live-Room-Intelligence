import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { cleanRoomCode, cleanText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
async function ensureRoom(sql, roomCode) { await sql`INSERT INTO rooms (code) VALUES (${roomCode}) ON CONFLICT (code) DO NOTHING`; }

export async function POST(req) {
  try {
    const sql = getSql();
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    const text = cleanText(body.text, 700);
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    if (!text || text.length < 3) return NextResponse.json({ error: 'Question is too short' }, { status: 400 });
    await ensureRoom(sql, roomCode);
    const rows = await sql`INSERT INTO questions (room_code, text) VALUES (${roomCode}, ${text}) RETURNING id, text, created_at`;
    return NextResponse.json({ ok: true, question: rows[0] });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function GET(req) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(req.url);
    const roomCode = cleanRoomCode(searchParams.get('roomCode'));
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    await ensureRoom(sql, roomCode);
    const questions = await sql`SELECT id, text, created_at FROM questions WHERE room_code = ${roomCode} ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json({ questions });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
