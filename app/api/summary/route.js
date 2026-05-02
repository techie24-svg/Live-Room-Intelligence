import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { sql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

function extractJson(text) {
  const cleaned = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Gemini did not return valid JSON.');
  }
}

function fallbackSummary(questions) {
  const topQuestions = questions.slice(0, 5).map((q) => q.text);
  return {
    oneLineSummary: questions.length
      ? 'The room is asking for clearer priorities, timelines, and impact.'
      : 'No questions submitted yet.',
    overallSentiment: 'neutral',
    topThemes: questions.length ? ['Priorities', 'Timeline', 'Impact'] : [],
    repeatedQuestions: [],
    questionsToAnswerFirst: topQuestions,
    executiveSummary: questions.length
      ? `There are ${questions.length} submitted questions. The presenter should address the most repeated themes first, then close with next steps.`
      : 'No audience questions are available to summarize.',
  };
}

function isQuotaError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit')
  );
}


function cleanPin(value) {
  return String(value || '').trim().replace(/\D/g, '').slice(0, 12);
}

async function verifyHostPin(roomCode, hostPin) {
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT`;
  const rows = await sql`SELECT host_pin FROM rooms WHERE code = ${roomCode} LIMIT 1`;
  if (!rows.length) return { ok: false, error: 'Room not found', status: 404 };
  if (rows[0].host_pin && rows[0].host_pin !== hostPin) {
    return { ok: false, error: 'Unauthorized host PIN', status: 403 };
  }
  return { ok: true };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const hostPin = cleanPin(body.hostPin);
    const hostCheck = await verifyHostPin(roomCode, hostPin);
    if (!hostCheck.ok) {
      return NextResponse.json({ error: hostCheck.error }, { status: hostCheck.status });
    }

    const questions = await sql`
      SELECT text, created_at
      FROM questions
      WHERE room_code = ${roomCode}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    if (!questions.length) {
      return NextResponse.json({ result: fallbackSummary([]) });
    }

    if (!process.env.GEMINI_API_KEY) {
      const result = fallbackSummary(questions);
      await sql`INSERT INTO summaries (room_code, result) VALUES (${roomCode}, ${JSON.stringify(result)}::jsonb)`;
      return NextResponse.json({ result, warning: 'GEMINI_API_KEY missing. Returned fallback summary.' });
    }

    const prompt = `
You are analyzing anonymous questions from a live session.
Be concise, neutral, and executive-ready. Do not invent facts.

Return STRICT JSON only with this exact shape:
{
  "oneLineSummary": "string",
  "overallSentiment": "positive | neutral | concerned | mixed",
  "topThemes": ["theme 1", "theme 2", "theme 3"],
  "repeatedQuestions": ["repeated question pattern"],
  "questionsToAnswerFirst": ["question 1", "question 2", "question 3"],
  "executiveSummary": "2-4 sentences"
}

Questions:
${questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}
`;

    let result;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents: prompt,
      });

      const raw =
        response?.text ||
        response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';

      result = extractJson(raw);
    } catch (geminiError) {
      console.error('Gemini summary failed:', geminiError);
      result = fallbackSummary(questions);

      await sql`INSERT INTO summaries (room_code, result) VALUES (${roomCode}, ${JSON.stringify(result)}::jsonb)`;

      return NextResponse.json({
        result,
        warning: isQuotaError(geminiError)
          ? 'Gemini quota exceeded. Returned fallback summary. Enable billing, increase quota, or try again later.'
          : 'Gemini failed. Returned fallback summary.',
      });
    }

    await sql`INSERT INTO summaries (room_code, result) VALUES (${roomCode}, ${JSON.stringify(result)}::jsonb)`;

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = cleanRoomCode(searchParams.get('roomCode'));
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

    const rows = await sql`
      SELECT result, created_at
      FROM summaries
      WHERE room_code = ${roomCode}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return NextResponse.json({ summary: rows[0] || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
