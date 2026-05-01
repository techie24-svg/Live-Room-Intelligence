# FeelPulse

A full-stack live session app using **Next.js + Vercel + Neon Postgres + Gemini API**.

It lets an audience:
- react live: Engaged / Neutral / Lost
- submit anonymous questions

It lets a presenter:
- see live session energy
- see anonymous questions
- generate Gemini-powered themes, summaries, and priority questions

## Stack

- Next.js App Router
- Tailwind CSS
- Neon Postgres
- Gemini API
- Vercel hosting
- Polling every 2 seconds for live updates

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL="your-neon-postgres-url"
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Initialize database

Run the SQL in `db/schema.sql` in Neon SQL Editor, or run:

```bash
npm run db:init
```

## 4. Run locally

```bash
npm run dev
```

Open:

- Home: http://localhost:3000
- Presenter: http://localhost:3000/presenter/feelpulse-demo
- Audience: http://localhost:3000/room/feelpulse-demo

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` with your Vercel URL
4. Deploy.

## 6. Demo flow

1. Open presenter dashboard.
2. Audience scans QR code.
3. Audience taps reactions and submits questions.
4. Presenter sees updates every 2 seconds.
5. Presenter clicks **Summarize Questions**.
6. Gemini returns themes, top questions, and executive summary.

## Notes

- Gemini and Neon keys are server-side only.
- This version intentionally uses polling instead of WebSockets to keep deployment simple and reliable.
- The app supports multiple rooms by changing the URL code, for example `/presenter/team-sync`.
