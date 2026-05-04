'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Brain, LockKeyhole, Power, RefreshCw, Sparkles, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EnergyBar from '@/components/EnergyBar';
import QuestionCard from '@/components/QuestionCard';
import { FeelPulseBrand, LightThemeStyles, ThemeToggle, usePersistentTheme } from '@/components/FeelPulseBrand';

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
      const [reactionRes, questionRes, summaryRes, participantRes, roomRes] = await Promise.all([
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
    if (!window.confirm('End this session now? Attendees will no longer be able to vote or ask questions.')) return;
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
      <main className={`min-h-screen px-6 py-10 transition-colors ${pageClass}`}>
        <LightThemeStyles />
        <div className="mx-auto mb-6 flex max-w-xl items-center justify-between gap-4">
          <FeelPulseBrand light={light} />
          <ThemeToggle light={light} onToggle={toggleTheme} />
        </div>
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-100"><LockKeyhole className="h-6 w-6" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Host Access</p>
              <h1 className="text-3xl font-bold">Enter host PIN</h1>
            </div>
          </div>
          <p className="mb-5 text-slate-300">Room code: <span className="font-semibold text-white">{roomCode}</span></p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin(pinInput);
            }}
          >
            <input
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Host PIN"
              inputMode="numeric"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-center text-2xl font-bold tracking-[0.25em] text-white placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-600"
              autoFocus
            />
            <button
              disabled={checkingPin}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingPin ? 'Checking...' : 'Unlock dashboard'}
            </button>
          </form>
          {pinError && <div className="mt-4 rounded-2xl bg-rose-500/10 p-4 text-center text-rose-200">{pinError}</div>}
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-6 py-8 transition-colors ${pageClass}`}>
      <LightThemeStyles />
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between gap-4">
        <FeelPulseBrand light={light} />
        <ThemeToggle light={light} onToggle={toggleTheme} />
      </div>
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Presenter Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">FeelPulse</h1>
            <p className="mt-2 text-slate-300">Room code: <span className="font-semibold text-white">{roomCode}</span></p>
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${roomEnded ? 'bg-rose-500/15 text-rose-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
              {roomEnded ? 'Session ended' : 'Session active'}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-4 rounded-3xl bg-white p-4 text-slate-950">
              <QRCodeSVG value={audienceUrl} size={104} />
              <div className="max-w-56">
                <p className="font-bold">Audience join link</p>
                <p className="break-all text-xs text-slate-600">{audienceUrl}</p>
              </div>
            </div>
            <button
              onClick={endSession}
              disabled={roomEnded || endingSession}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-5 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              <Power className="h-5 w-5" /> {roomEnded ? 'Session ended' : endingSession ? 'Ending...' : 'End session'}
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            {roomEnded && (
              <div className="flex items-start gap-3 rounded-3xl border border-rose-300/20 bg-rose-500/10 p-5 text-rose-100">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">This session has ended.</p>
                  <p className="mt-1 text-sm text-rose-100/80">Attendees will see an expired-session message and cannot submit new votes or questions.</p>
                </div>
              </div>
            )}
            <EnergyBar totals={reactions} />

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
                <div className="rounded-2xl bg-blue-500/20 p-3"><Users className="h-6 w-6 text-blue-200" /></div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Live Room</p>
                  <h2 className="text-2xl font-bold">Current Participants ({participants.length})</h2>
                </div>
              </div>

              {participants.length ? (
                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {participants.map((p) => (
                    <div key={p.session_id || `${p.user_name}-${p.joined_at}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/60 px-4 py-3">
                      <span className="font-semibold text-slate-100">{p.user_name || 'Anonymous'}</span>
                      <span className="text-xs text-slate-500">
                        {p.last_seen_at ? new Date(p.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-slate-400">
                  No participants have joined yet.
                </p>
              )}
            </div>

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
