import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifySecret(req) {
  const configuredSecret = process.env.SETUP_SECRET;
  if (!configuredSecret) return true;
  return req.headers.get('x-setup-secret') === configuredSecret;
}

async function tableExists(sql, tableName) {
  const rows = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function runSetup(sql) {
  await sql`CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT 'Townhall', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS reactions (id BIGSERIAL PRIMARY KEY, room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('engaged', 'neutral', 'lost')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reactions_room_created_at ON reactions(room_code, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS questions (id BIGSERIAL PRIMARY KEY, room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, text TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_questions_room_created_at ON questions(room_code, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS summaries (id BIGSERIAL PRIMARY KEY, room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, result JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_summaries_room_created_at ON summaries(room_code, created_at DESC)`;
  await sql`INSERT INTO rooms (code, title) VALUES ('townhall-demo', 'Townhall Demo') ON CONFLICT (code) DO NOTHING`;
}

export async function GET(req) {
  try {
    if (!verifySecret(req)) return NextResponse.json({ error: 'Invalid setup secret.' }, { status: 401 });
    const sql = getSql();
    const tables = {
      rooms: await tableExists(sql, 'rooms'),
      reactions: await tableExists(sql, 'reactions'),
      questions: await tableExists(sql, 'questions'),
      summaries: await tableExists(sql, 'summaries'),
    };
    const ok = Object.values(tables).every(Boolean);
    return NextResponse.json({ ok, tables, message: ok ? 'Database tables already exist.' : 'Some tables are missing. Click Run Setup.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!verifySecret(req)) return NextResponse.json({ error: 'Invalid setup secret.' }, { status: 401 });
    const sql = getSql();
    await runSetup(sql);
    return NextResponse.json({
      ok: true,
      message: 'Database setup complete.',
      tables: { rooms: true, reactions: true, questions: true, summaries: true },
      nextSteps: ['Open /room/townhall-demo', 'Submit a reaction and question', 'Open /presenter/townhall-demo and click Summarize Questions'],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
