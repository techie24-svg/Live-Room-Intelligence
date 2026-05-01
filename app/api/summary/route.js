import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@/lib/db';
import { cleanRoomCode } from '@/lib/sanitize';

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
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
    oneLineSummary: questions.length ? 'The room is asking for clearer priorities, timelines, and impact.' : 'No questions submitted yet.',
    overallSentiment: 'neutral',
    topThemes: questions.length ? ['Priorities', 'Timeline', 'Impact'] : [],
    repeatedQuestions: [],
    questionsToAnswerFirst: topQuestions,
    executiveSummary: questions.length
      ? `There are ${questions.length} submitted questions. The presenter should address the most repeated themes first, then close with next steps.`
      : 'No audience questions are available to summarize.',
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const roomCode = cleanRoomCode(body.roomCode);
    if (!roomCode) return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const response = await model.generateContent(prompt);
    const raw = response.response.text();
    const result = extractJson(raw);

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
