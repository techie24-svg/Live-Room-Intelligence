'use client';

import { useEffect, useMemo, useState } from 'react';
import { Brain, RefreshCw, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EnergyBar from '@/components/EnergyBar';
import QuestionCard from '@/components/QuestionCard';

export default function Presenter({ params }) {
  const roomCode = params.code;
  const [reactions, setReactions] = useState({ engaged: 0, neutral: 0, lost: 0 });
  const [recent, setRecent] = useState({ engaged: 0, neutral: 0, lost: 0 });
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [hostPin, setHostPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [checkingPin, setCheckingPin] = useState(true);

  const audienceUrl = useMemo(() => {
    if (typeof window !== 'undefined') return `${window.location.origin}/room/${roomCode}`;
    return `/room/${roomCode}`;
  }, [roomCode]);

  async function fetchAll() {
    if (!hostPin) return;
    try {
      const [reactionRes, questionRes, summaryRes] = await Promise.all([
        fetch(`/api/reactions?roomCode=${roomCode}`, { cache: 'no-store' }),
        fetch(`/api/questions?roomCode=${roomCode}`, { cache: 'no-store' }),
        fetch(`/api/summary?roomCode=${roomCode}`, { cache: 'no-store' }),
      ]);
      const reactionData = await reactionRes.json();
      const questionData = await questionRes.json();
      const summaryData = await summaryRes.json();
      if (reactionData.totals) setReactions(reactionData.totals);
      if (reactionData.recent) setRecent(reactionData.recent);
      if (questionData.questions) setQuestions(questionData.questions);
      if (summaryData.summary?.result) setSummary(summaryData.summary.result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function generateSummary() {
    setLoadingSummary(true);
    setError('');
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to summarize');
      setSummary(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    const storedPin = typeof window !== 'undefined' ? localStorage.getItem(`hostPin:${roomCode}`) : '';
    if (!storedPin) {
      setCheckingPin(false);
      return;
    }

    fetch(`/api/rooms?roomCode=${encodeURIComponent(roomCode)}&host=1&hostPin=${encodeURIComponent(storedPin)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Host PIN required');
        setHostPin(storedPin);
      })
      .catch(() => {
        localStorage.removeItem(`hostPin:${roomCode}`);
        setHostPin('');
      })
      .finally(() => setCheckingPin(false));
  }, [roomCode]);

  useEffect(() => {
    if (!hostPin) return;
    fetchAll();
    const id = setInterval(fetchAll, 2000);
    return () => clearInterval(id);
  }, [roomCode, hostPin]);

  async function unlockHost(e) {
    e.preventDefault();
    setError('');
    const pin = pinInput.trim();
    if (!pin) {
      setError('Enter the host PIN.');
      return;
    }

    const res = await fetch(`/api/rooms?roomCode=${encodeURIComponent(roomCode)}&host=1&hostPin=${encodeURIComponent(pin)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invalid host PIN');
      return;
    }

    localStorage.setItem(`hostPin:${roomCode}`, pin);
    setHostPin(pin);
  }

  const totalRecent = recent.engaged + recent.neutral + recent.lost;

  if (checkingPin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">FeelPulse</p>
          <h1 className="mt-3 text-3xl font-bold">Checking host access...</h1>
        </div>
      </main>
    );
  }

  if (!hostPin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <form onSubmit={unlockHost} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Host Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">Enter host PIN</h1>
          <p className="mt-3 text-slate-300">Room code: <span className="font-semibold text-white">{roomCode}</span></p>
          <input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="HOST PIN"
            className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-center text-2xl font-bold tracking-[0.25em] text-white placeholder:text-slate-600"
          />
          <button className="mt-4 w-full rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white transition hover:bg-blue-400">
            Unlock dashboard
          </button>
          {error && <div className="mt-4 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Presenter Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">FeelPulse</h1>
            <p className="mt-2 text-slate-300">Room code: <span className="font-semibold text-white">{roomCode}</span></p>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white p-4 text-slate-950">
            <QRCodeSVG value={audienceUrl} size={104} />
            <div className="max-w-56">
              <p className="font-bold">Audience join link</p>
              <p className="break-all text-xs text-slate-600">{audienceUrl}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <EnergyBar totals={reactions} />

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Live Signal</p>
                  <h2 className="text-2xl font-bold">Last 30 seconds</h2>
                </div>
                <div className="rounded-2xl bg-blue-500/20 px-4 py-2 text-blue-100">{totalRecent} reactions</div>
              </div>
              <p className="mt-4 text-slate-300">
                {totalRecent > 20
                  ? 'Energy spike detected. This is a good moment to pause and address the room.'
                  : totalRecent > 0
                    ? 'Audience activity is flowing steadily.'
                    : 'No recent reactions. Ask the room to scan and tap.'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Question Wall</p>
                  <h2 className="text-2xl font-bold">{questions.length} questions</h2>
                </div>
                <button onClick={fetchAll} className="rounded-2xl border border-white/10 p-3 transition hover:bg-white/10" aria-label="Refresh">
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {questions.length ? questions.map((q) => <QuestionCard key={q.id} question={q} />) : (
                  <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400 md:col-span-2">No questions yet.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/20 p-3"><Brain className="h-6 w-6 text-blue-200" /></div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Gemini AI</p>
                  <h2 className="text-2xl font-bold">Room Summary</h2>
                </div>
              </div>
              <button
                onClick={generateSummary}
                disabled={loadingSummary}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-5 w-5" /> {loadingSummary ? 'Summarizing...' : 'Summarize Questions'}
              </button>

              {error && <div className="mb-4 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

              {summary ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-400">One-line summary</p>
                    <p className="mt-1 font-semibold">{summary.oneLineSummary}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">Top themes</p>
                    <div className="flex flex-wrap gap-2">
                      {(summary.topThemes || []).map((theme) => (
                        <span key={theme} className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-100">{theme}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">Answer first</p>
                    <div className="space-y-2">
                      {(summary.questionsToAnswerFirst || []).map((q, index) => (
                        <div key={index} className="rounded-2xl bg-slate-950/60 p-3 text-sm">{q}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-400">Executive summary</p>
                    <p className="mt-1 text-slate-100">{summary.executiveSummary}</p>
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-slate-400">
                  Submit a few questions, then generate a summary.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
