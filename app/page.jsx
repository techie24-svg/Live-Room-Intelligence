'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, MessageSquareText, QrCode, ShieldCheck, Users } from 'lucide-react';
import FeelPulseLogo from '@/components/FeelPulseLogo';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [hostPinInput, setHostPinInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function createSession() {
    const hostPin = hostPinInput.trim();
    if (!/^\d{4,12}$/.test(hostPin)) {
      setError('Set a host PIN using 4 to 12 numbers.');
      return;
    }

    setCreating(true);
    setError('');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const roomCode = makeRoomCode();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostPin }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`hostPin:${roomCode}`, data.hostPin || hostPin);
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

    const data = await res.json();
    if (data?.room && data.room.is_active === false) {
      setError('This session has ended. Ask the host to create a new one.');
      setJoining(false);
      return;
    }

    router.push(`/room/${roomCode}`);
  }

  return (
    <main className="fp-shell min-h-screen overflow-hidden px-5 py-6">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="fp-dot-wave absolute bottom-0 right-[-10%] h-72 w-[55rem] rotate-[-8deg]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between rounded-3xl border border-[var(--fp-border)] bg-[var(--fp-card)] px-5 py-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <FeelPulseLogo size="sm" />
          <div className="hidden items-center gap-8 text-sm font-medium text-[var(--fp-muted)] md:flex">
            <span>Features</span>
            <span>How it works</span>
            <span>Security</span>
          </div>
          <ThemeToggle />
        </nav>

        <section className="grid items-center gap-10 rounded-[2rem] border border-[var(--fp-border)] bg-[var(--fp-card)] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
          <div className="flex justify-center lg:justify-start">
            <FeelPulseLogo size="lg" showText={false} className="scale-150 py-16 lg:scale-[1.9]" />
          </div>

          <div>
            <div className="mb-6 inline-flex rounded-full border border-[var(--fp-border)] bg-[var(--fp-card-strong)] px-4 py-2 text-sm font-semibold text-[var(--fp-muted)]">
              Live reactions · Anonymous questions · AI summaries
            </div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-[var(--fp-text)] md:text-7xl">
              Understand every room. <span className="fp-gradient-text block">Engage every moment.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--fp-muted)]">
              FeelPulse helps presenters and educators read the room in real time with live reactions, anonymous questions, and smart session summaries.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-[var(--fp-border)] bg-[var(--fp-card-strong)] p-5">
                <h2 className="text-xl font-bold text-[var(--fp-text)]">Create your session</h2>
                <p className="mt-2 text-sm text-[var(--fp-muted)]">Protect the host dashboard with a PIN.</p>
                <input
                  value={hostPinInput}
                  onChange={(e) => setHostPinInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Create 4-12 digit PIN"
                  inputMode="numeric"
                  className="fp-input mt-4 w-full rounded-2xl p-4 text-center text-xl font-bold tracking-[0.2em] placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal"
                />
                <button onClick={createSession} disabled={creating} className="fp-gradient-button mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold transition hover:scale-[1.01] disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create Session'} <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={joinSession} className="rounded-3xl border border-[var(--fp-border)] bg-[var(--fp-card-strong)] p-5">
                <h2 className="text-xl font-bold text-[var(--fp-text)]">Join as participant</h2>
                <p className="mt-2 text-sm text-[var(--fp-muted)]">Enter the room code from the presenter.</p>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="fp-input mt-4 w-full rounded-2xl p-4 text-center text-2xl font-black uppercase tracking-[0.25em]"
                />
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--fp-primary-2)] px-5 py-4 font-bold text-[var(--fp-text)] transition hover:bg-[var(--fp-card)]">
                  {joining ? 'Joining...' : 'Join Room'} <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>

            {error && <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</p>}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            [Users, 'Real-time participants', 'See who joined your room.'],
            [QrCode, 'Join by code or QR', 'Fast participant access.'],
            [MessageSquareText, 'Anonymous Q&A', 'Questions with or without name.'],
            [BarChart3, 'Room pulse', 'One feeling vote per attendee.'],
          ].map(([Icon, title, body]) => (
            <div key={title} className="fp-card rounded-3xl p-5">
              <Icon className="mb-4 h-6 w-6 text-sky-400" />
              <h3 className="font-bold text-[var(--fp-text)]">{title}</h3>
              <p className="mt-2 text-sm text-[var(--fp-muted)]">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
