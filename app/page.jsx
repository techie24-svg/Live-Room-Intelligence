'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, QrCode, MessageSquareText } from 'lucide-react';

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function cleanRoomCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function createSession() {
    setCreating(true);
    setError('');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const roomCode = makeRoomCode();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });

      if (res.ok) {
        router.push(`/presenter/${roomCode}`);
        return;
      }
    }

    setError('Could not create a unique session. Please try again.');
    setCreating(false);
  }

  async function joinSession(e) {
    e.preventDefault();
    setJoining(true);
    setError('');
    const roomCode = cleanRoomCode(joinCode);

    if (!roomCode) {
      setError('Enter a room code.');
      setJoining(false);
      return;
    }

    const res = await fetch(`/api/rooms?roomCode=${encodeURIComponent(roomCode)}`, { cache: 'no-store' });
    if (!res.ok) {
      setError('That session code was not found. Check the presenter screen and try again.');
      setJoining(false);
      return;
    }

    router.push(`/room/${roomCode}`);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-blue-200">Live Room Intelligence</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            Create a live session. Let people join by code.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Each host gets a unique session code. Participants can ask many questions, but each person/device has one active feeling vote per session.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <h2 className="text-2xl font-bold">Host a session</h2>
              <p className="mt-2 text-slate-400">Create a fresh room code and presenter dashboard.</p>
              <button
                onClick={createSession}
                disabled={creating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create new session'} <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={joinSession} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <h2 className="text-2xl font-bold">Join a session</h2>
              <p className="mt-2 text-slate-400">Enter the code shown on the presenter screen.</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-center text-2xl font-bold uppercase tracking-[0.25em] text-white placeholder:text-slate-600"
              />
              <button
                disabled={joining}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-4 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                {joining ? 'Joining...' : 'Join room'} <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>

          {error && <div className="mt-5 rounded-2xl bg-rose-500/10 p-4 text-rose-200">{error}</div>}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [Users, 'Multiple hosts', 'Every host creates a separate room/session code, so sessions do not mix.'],
            [QrCode, 'Join by code or QR', 'Audience can scan the presenter QR or type the code manually.'],
            [MessageSquareText, 'Questions + one feeling vote', 'People can ask multiple questions, but only one active feeling vote per session.'],
          ].map(([Icon, title, body]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-200"><Icon className="h-5 w-5" /></div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
