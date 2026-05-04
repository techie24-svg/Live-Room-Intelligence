'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  LockKeyhole,
  Power,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QuestionCard from '@/components/QuestionCard';
import {
  FeelPulseBrand,
  ThemeToggle,
  usePersistentTheme,
} from '@/components/FeelPulseBrand';

export default function Presenter({ params }) {
  const roomCode = params.code;
  const { light, toggleTheme, pageClass } = usePersistentTheme();

  const [hostPin, setHostPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const [reactions, setReactions] = useState({ engaged: 0, neutral: 0, lost: 0 });
  const [recent, setRecent] = useState({ engaged: 0, neutral: 0, lost: 0 });
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const audienceUrl = useMemo(() => {
    if (typeof window !== 'undefined') return `${window.location.origin}/room/${roomCode}`;
    return `/room/${roomCode}`;
  }, [roomCode]);

  const card = light
    ? 'border border-slate-200 bg-white shadow-lg shadow-slate-200/70'
    : 'border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/30';

  const soft = light ? 'text-slate-600' : 'text-slate-400';
  const eyebrow = light ? 'text-sky-600' : 'text-blue-200';
  const mutedBox = light
    ? 'border border-slate-200 bg-slate-50'
    : 'border border-slate-800 bg-slate-950/80';

  async function verifyPin(pinValue) {
    const cleanPin = String(pinValue || '').replace(/\D/g, '').slice(0, 12);

    if (!cleanPin) {
      setPinError('Enter the host PIN for this room.');
      return;
    }

    setCheckingPin(true);
    setPinError('');

    try {
      const res = await fetch('/api/host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostPin: cleanPin }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || 'Incorrect host PIN');

      window.localStorage.setItem(`hostPin:${roomCode}`, cleanPin);
      setHostPin(cleanPin);
      setPinVerified(true);
    } catch (err) {
      setPinVerified(false);
      setPinError(err.message || 'Incorrect host PIN');
    } finally {
      setCheckingPin(false);
    }
  }

  useEffect(() => {
    const storedPin = window.localStorage.getItem(`hostPin:${roomCode}`) || '';
    if (storedPin) {
      setPinInput(storedPin);
      verifyPin(storedPin);
    }
  }, [roomCode]);

  async function fetchAll() {
    if (!pinVerified) return;

    try {
      const [reactionRes, questionRes, summaryRes, participantRes, roomRes] =
        await Promise.all([
          fetch(`/api/reactions?roomCode=${roomCode}`, { cache: 'no-store' }),
          fetch(`/api/questions?roomCode=${roomCode}`, { cache: 'no-store' }),
          fetch(`/api/summary?roomCode=${roomCode}`, { cache: 'no-store' }),
          fetch(`/api/participants?roomCode=${roomCode}`, { cache: 'no-store' }),
          fetch(`/api/rooms?roomCode=${roomCode}`, { cache: 'no-store' }),
        ]);

      const reactionData = await reactionRes.json();
      const questionData = await questionRes.json();
      const summaryData = await summaryRes.json();
      const participantData = await participantRes.json();
      const roomData = await roomRes.json();

      if (reactionData.totals) setReactions(reactionData.totals);
      if (reactionData.recent) setRecent(reactionData.recent);
      if (questionData.questions) setQuestions(questionData.questions);
      if (participantData.participants) setParticipants(participantData.participants);
      if (summaryData.summary?.result) setSummary(summaryData.summary.result);
      if (roomData.room) setRoomEnded(Boolean(roomData.room.ended_at));
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
      if (data.warning) setError(data.warning);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function endSession() {
    if (!window.confirm('End this session now? Attendees will no longer be able to vote or ask questions.')) {
      return;
    }

    setEndingSession(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostPin, action: 'end' }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Could not end session');

      setRoomEnded(true);
      fetchAll();
    } catch (err) {
      setError(err.message || 'Could not end session');
    } finally {
      setEndingSession(false);
    }
  }

  useEffect(() => {
    if (!pinVerified) return;

    fetchAll();
    const id = setInterval(fetchAll, 2000);

    return () => clearInterval(id);
  }, [roomCode, pinVerified]);

  const totalRecent = recent.engaged + recent.neutral + recent.lost;

  if (!pinVerified) {
    return (
      <main className={`min-h-screen px-4 py-8 ${pageClass}`}>
        <div className="mx-auto max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <FeelPulseBrand light={light} />
            <ThemeToggle light={light} toggleTheme={toggleTheme} />
          </div>

          <div className={`rounded-[2rem] p-6 ${card}`}>
            <div className="mb-5 flex items-center gap-3">
              <div className={light ? 'rounded-2xl bg-sky-100 p-3' : 'rounded-2xl bg-sky-500/15 p-3'}>
                <LockKeyhole className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Host Access</p>
                <h1 className="text-2xl font-black">Enter host PIN</h1>
              </div>
            </div>

            <p className={`mb-5 ${soft}`}>Room code: <span className="font-black">{roomCode}</span></p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyPin(pinInput);
              }}
              className="space-y-4"
            >
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Host PIN"
                inputMode="numeric"
                className={`w-full rounded-2xl border p-4 text-center text-2xl font-bold tracking-[0.25em] outline-none ${
                  light
                    ? 'border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400'
                    : 'border-white/10 bg-slate-900 text-white placeholder:text-slate-600'
                }`}
                autoFocus
              />

              <button className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 px-5 py-4 font-black text-white">
                {checkingPin ? 'Checking...' : 'Unlock dashboard'}
              </button>
            </form>

            {pinError && <p className="mt-4 text-sm font-semibold text-rose-400">{pinError}</p>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 py-8 transition-colors duration-300 ${pageClass}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <FeelPulseBrand light={light} />
          <ThemeToggle light={light} toggleTheme={toggleTheme} />
        </div>

        <section className={`mb-8 rounded-[2rem] p-6 md:p-8 ${card}`}>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Presenter Dashboard</p>
              <h1 className="mt-3 text-4xl font-black">Session Control</h1>
              <p className={`mt-3 text-lg ${soft}`}>
                Room code: <span className="font-black text-current">{roomCode}</span>
              </p>

              <div className={`mt-5 inline-flex rounded-full px-5 py-2 text-sm font-black ${
                roomEnded
                  ? 'bg-rose-500/15 text-rose-500'
                  : light
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-500/15 text-emerald-300'
              }`}>
                {roomEnded ? 'Session ended' : 'Session active'}
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className={`rounded-2xl p-3 ${light ? 'bg-slate-50 ring-1 ring-slate-200' : 'bg-white'}`}>
                <QRCodeSVG value={audienceUrl} size={120} />
              </div>

              <div>
                <p className="font-black">Audience join link</p>
                <p className={`max-w-xs break-all text-sm ${soft}`}>{audienceUrl}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={endSession}
              disabled={roomEnded || endingSession}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/15 px-5 py-3 font-black text-rose-500 ring-1 ring-rose-400/25 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Power className="h-5 w-5" />
              {roomEnded ? 'Session ended' : endingSession ? 'Ending...' : 'End session'}
            </button>
          </div>

          {roomEnded && (
            <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-500">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Attendees will see an expired-session message and cannot submit new votes or questions.
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.75fr]">
          <div className="space-y-6">
            <section className={`rounded-[2rem] p-6 ${card}`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Room Energy</p>
                  <h2 className="text-3xl font-black">
                    {totalRecent ? Math.round((recent.engaged / totalRecent) * 100) : 0}% engaged
                  </h2>
                </div>
                <div className={light ? 'rounded-full bg-blue-100 p-5' : 'rounded-full bg-blue-500/15 p-5'}>
                  <Sparkles className="h-7 w-7 text-blue-400" />
                </div>
              </div>

              <div className={light ? 'mt-6 h-4 overflow-hidden rounded-full bg-slate-200' : 'mt-6 h-4 overflow-hidden rounded-full bg-slate-950'}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${totalRecent ? Math.round((recent.engaged / totalRecent) * 100) : 0}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ['Engaged', reactions.engaged, 'bg-emerald-500/10'],
                  ['Neutral', reactions.neutral, 'bg-amber-500/10'],
                  ['Lost', reactions.lost, 'bg-rose-500/10'],
                ].map(([label, count, bg]) => (
                  <div key={label} className={`rounded-2xl p-4 text-center ${bg}`}>
                    <p className="text-3xl font-black">{count}</p>
                    <p className={`text-sm ${soft}`}>{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-[2rem] p-6 ${card}`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Question Wall</p>
                  <h2 className="text-3xl font-black">{questions.length} questions</h2>
                </div>

                <button
                  onClick={fetchAll}
                  className={`rounded-2xl border p-3 ${light ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {questions.length ? (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl border border-dashed p-8 text-center ${light ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-400'}`}>
                  No questions yet.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className={`rounded-[2rem] p-6 ${card}`}>
              <div className="mb-5 flex items-center gap-3">
                <div className={light ? 'rounded-2xl bg-blue-100 p-3' : 'rounded-2xl bg-blue-500/15 p-3'}>
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className={`text-sm font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Live Room</p>
                  <h2 className="text-2xl font-black">Current Participants ({participants.length})</h2>
                </div>
              </div>

              {participants.length ? (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {participants.map((p) => (
                    <div key={p.session_id || p.user_name} className={`rounded-2xl px-4 py-3 ${mutedBox}`}>
                      <p className="font-black">{p.user_name || 'Anonymous'}</p>
                      {p.last_seen_at && (
                        <p className={`text-xs ${soft}`}>
                          Last seen {new Date(p.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl border border-dashed p-6 text-center ${light ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-400'}`}>
                  No participants have joined yet.
                </div>
              )}
            </section>

            <section className={`rounded-[2rem] p-6 ${card}`}>
              <div className="mb-5 flex items-center gap-3">
                <div className={light ? 'rounded-2xl bg-blue-100 p-3' : 'rounded-2xl bg-blue-500/15 p-3'}>
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className={`text-sm font-bold uppercase tracking-[0.35em] ${eyebrow}`}>Gemini AI</p>
                  <h2 className="text-2xl font-black">Room Summary</h2>
                </div>
              </div>

              <button
                onClick={generateSummary}
                disabled={loadingSummary}
                className="w-full rounded-2xl bg-blue-500 px-5 py-4 font-black text-white transition hover:bg-blue-400 disabled:opacity-60"
              >
                {loadingSummary ? 'Summarizing...' : 'Summarize Questions'}
              </button>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
                  {error}
                </div>
              )}

              {summary ? (
                <div className="mt-5 space-y-4">
                  <div className={mutedBox + ' rounded-2xl p-4'}>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${eyebrow}`}>One-line summary</p>
                    <p className="mt-2">{summary.oneLineSummary}</p>
                  </div>

                  <div>
                    <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${eyebrow}`}>Top themes</p>
                    <div className="flex flex-wrap gap-2">
                      {(summary.topThemes || []).map((theme) => (
                        <span key={theme} className={light ? 'rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700' : 'rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white'}>
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${eyebrow}`}>Answer first</p>
                    <ol className={`list-decimal space-y-2 pl-5 text-sm ${soft}`}>
                      {(summary.questionsToAnswerFirst || []).map((q, index) => (
                        <li key={`${q}-${index}`}>{q}</li>
                      ))}
                    </ol>
                  </div>

                  <div className={mutedBox + ' rounded-2xl p-4'}>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${eyebrow}`}>Executive summary</p>
                    <p className={`mt-2 text-sm ${soft}`}>{summary.executiveSummary}</p>
                  </div>
                </div>
              ) : (
                <div className={`mt-5 rounded-2xl border border-dashed p-6 text-center ${light ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-400'}`}>
                  Submit a few questions, then generate a summary.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
