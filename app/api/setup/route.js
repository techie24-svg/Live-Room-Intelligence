import { sql } from "@/lib/db";

export async function POST(req) {
  try {
    const { secret } = await req.json();

    if (secret !== process.env.SETUP_SECRET) {
      return Response.json({ ok: false, error: "Invalid secret" }, { status: 401 });
    }

    await sql(`CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      text TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
