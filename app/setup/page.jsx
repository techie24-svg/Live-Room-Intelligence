'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function callSetup(method) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/setup', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'x-setup-secret': secret } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup request failed.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-blue-200">Database Setup</p>
          <h1 className="text-4xl font-bold md:text-6xl">Initialize Neon tables</h1>
          <p className="mt-5 text-slate-300">
            Use this once after deploying to Vercel and connecting Neon. It creates the rooms, reactions, questions, and summaries tables.
          </p>

          <div className="mt-8 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm text-yellow-100">
            In production, set <span className="font-mono">SETUP_SECRET</span> in Vercel and enter it below. This prevents random users from running setup.
          </div>

          <label className="mt-6 block text-sm font-medium text-slate-200">Setup secret</label>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Only needed when SETUP_SECRET is configured"
            type="password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500"
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => callSetup('GET')}
              disabled={loading}
              className="rounded-2xl border border-white/15 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check Status
            </button>
            <button
              onClick={() => callSetup('POST')}
              disabled={loading}
              className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Run Setup'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
            <p className="font-semibold">Setup failed</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-100">
            <p className="font-semibold">{result.message || 'Status checked'}</p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-slate-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 flex gap-4 text-sm text-slate-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/presenter/feelpulse-demo" className="hover:text-white">Presenter Demo</Link>
          <Link href="/room/feelpulse-demo" className="hover:text-white">Audience Demo</Link>
        </div>
      </div>
    </main>
  );
}
