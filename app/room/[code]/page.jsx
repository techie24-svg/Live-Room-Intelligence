'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Frown,
  Meh,
  Send,
  Smile,
  UserRound,
} from 'lucide-react';
import { getOrCreateSessionId } from '@/lib/session';
import {
  FeelPulseBrand,
  ThemeToggle,
  usePersistentTheme,
} from '@/components/FeelPulseBrand';

export default function AudienceRoom({ params }) {
  const roomCode = params.code;
  const { light, toggleTheme, pageClass } = usePersistentTheme();

  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [myQuestions, setMyQuestions] = useState([]);
  const [askAnonymously, setAskAnonymously] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);
  const [roomChecked, setRoomChecked] = useState(false);

  const card = light
    ? 'border border-slate-200 bg-white shadow-lg shadow-slate-200/70'
    : 'border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20';

  const input = light
    ? 'border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400'
    : 'border-white/10 bg-slate-900 text-white placeholder:text-slate-500';

  const soft = light ? 'text-slate-600' : 'text-slate-400';
  const mutedBox = light
    ? 'border border-slate-200 bg-slate-50'
    : 'border border-white/10 bg-slate-900/70';

  useEffect(() => {
    const id = getOrCreateSessionId(`voter:${roomCode}`);
    setSessionId(id);

    const storedName = window.localStorage.getItem(`feelpulse-name:${roomCode}`) || '';

    if (storedName) {
      setUserName(storedName);
      setNameInput(storedName);
    }
  }, [roomCode]);

  async function checkRoomStatus() {
    try {
      const res = await fetch(`/api/rooms?roomCode=${encodeURIComponent(roomCode)}`, {
        cache: 'no-store',
      });

      const data = await res.json();
      const ended = !res.ok || Boolean(data.room?.ended_at);

      setRoomEnded(ended);

      return ended;
    } catch (_) {
      return roomEnded;
    } finally {
      setRoomChecked(true);
    }
  }

  useEffect(() => {
    checkRoomStatus();

    const id = setInterval(checkRoomStatus, 3000);

    return () => clearInterval(id);
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !sessionId || !userName || roomEnded) return;

    fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, sessionId, userName }),
    }).catch(() => {});
  }, [roomCode, sessionId, userName, roomEnded]);

  async function loadMyQuestions(id = sessionId) {
    if (!roomCode || !id) return;

    try {
      const res = await fetch(
        `/api/questions?roomCode=${roomCode}&sessionId=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (data.questions) setMyQuestions(data.questions);
    } catch (_) {}
  }

  useEffect(() => {
    if (!roomCode || !sessionId || !userName || roomEnded) return;
    loadMyQuestions(sessionId);
  }, [roomCode, sessionId, userName, roomEnded]);

  async function joinRoom(e) {
    e.preventDefault();

    const ended = await checkRoomStatus();

    if (ended) {
      setStatus('This session has ended.');
      return;
    }

    const finalName = nameInput.trim() || 'Anonymous';

    if (!sessionId) {
      setStatus('Preparing your session. Please try again.');
      return;
    }

    setJoining(true);
    setStatus('');

    window.localStorage.setItem(`feelpulse-name:${roomCode}`, finalName);

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, sessionId, userName: finalName }),
      });

      if (!res.ok) throw new Error('Could not join room');

      setUserName(finalName);
      await loadMyQuestions(sessionId);
    } catch (err) {
      setStatus(err.message || 'Could not join room');
    } finally {
      setJoining(false);
    }
  }

  async function sendReaction(type) {
    if (roomEnded) {
      setStatus('This session has ended.');
      return;
    }

    if (!sessionId) {
      setStatus('Preparing your voting session. Please tap again.');
      return;
    }

    setSelected(type);
    setStatus('Vote saved');

    const res = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, type, sessionId }),
    });

    if (!res.ok) {
      if (res.status === 410) setRoomEnded(true);
      setStatus(res.status === 410 ? 'This session has ended.' : 'Could not save vote');
      return;
    }

    setTimeout(() => setStatus(''), 1400);
  }

  async function submitQuestion(e) {
    e.preventDefault();

    if (roomEnded) {
      setStatus('This session has ended.');
      return;
    }

    if (!question.trim()) return;

    const text = question.trim();
    const visibleName = askAnonymously ? 'Anonymous' : userName || 'Anonymous';

    setQuestion('');
    setStatus('Question submitted');

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, text, userName: visibleName, sessionId }),
    });

    if (!res.ok) {
      if (res.status === 410) setRoomEnded(true);
      setStatus(res.status === 410 ? 'This session has ended.' : 'Could not submit question');
      return;
    }

    const data = await res.json();

    if (data.question) setMyQuestions((prev) => [data.question, ...prev]);

    setTimeout(() => setStatus(''), 1800);
  }

  const reactions = useMemo(
    () => [
      { type: 'engaged', label: 'Engaged', icon: Smile, emoji: '👍' },
      { type: 'neutral', label: 'Neutral', icon: Meh, emoji: '😐' },
      { type: 'lost', label: 'Lost', icon: Frown, emoji: '😵‍💫' },
    ],
    []
  );

  if (roomChecked && roomEnded) {
    return (
      <main className={`min-h-screen px-4 py-8 ${pageClass}`}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <FeelPulseBrand light={light} />
            <ThemeToggle light={light} toggleTheme={toggleTheme} />
          </div>

          <div className={`rounded-[2rem] p-8 text-center ${card}`}>
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
            <h1 className="text-3xl font-black">This session has ended</h1>
            <p className={`mt-3 ${soft}`}>
              The host ended this session, so new votes and questions are closed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!userName) {
    return (
      <main className={`min-h-screen px-4 py-8 ${pageClass}`}>
        <div className="mx-auto max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <FeelPulseBrand light={light} />
            <ThemeToggle light={light} toggleTheme={toggleTheme} />
          </div>

          <form onSubmit={joinRoom} className={`rounded-[2rem] p-6 ${card}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className={light ? 'rounded-2xl bg-sky-100 p-3' : 'rounded-2xl bg-sky-500/15 p-3'}>
                <UserRound className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className={light ? 'text-sm font-bold uppercase tracking-[0.3em] text-sky-600' : 'text-sm font-bold uppercase tracking-[0.3em] text-blue-200'}>
                  Room
                </p>
                <h1 className="text-2xl font-black">{roomCode}</h1>
              </div>
            </div>

            <p className={`mb-5 text-sm ${soft}`}>
              Enter your name or nickname before joining. You can still ask individual questions anonymously later.
            </p>

            <label className={`mb-2 block text-sm font-bold ${soft}`}>
              What should we call you?
            </label>

            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name or nickname"
              maxLength={80}
              className={`mb-4 w-full rounded-2xl border p-4 outline-none ${input}`}
              autoFocus
            />

            <button
              type="submit"
              disabled={joining}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
            >
              {joining ? 'Joining...' : 'Continue'}
            </button>

            {status && <p className="mt-4 text-sm font-semibold text-rose-400">{status}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 py-8 ${pageClass}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <FeelPulseBrand light={light} />
          <ThemeToggle light={light} toggleTheme={toggleTheme} />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-black">Welcome, {userName}</h1>
          <p className={`mt-2 ${soft}`}>React honestly and submit questions as {userName}.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <div className={`rounded-[2rem] p-6 ${card}`}>
              <h2 className="text-xl font-black">How are you feeling?</h2>
              <p className={`mt-2 text-sm ${soft}`}>
                One vote per device/session. Changing your choice updates your vote instead of adding another one.
              </p>

              <div className="mt-5 grid gap-3">
                {reactions.map(({ type, label, icon: Icon, emoji }) => (
                  <button
                    key={type}
                    onClick={() => sendReaction(type)}
                    className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
                      selected === type
                        ? 'border-blue-300 bg-blue-500/20'
                        : light
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-3 font-bold">
                      <Icon className="h-5 w-5" />
                      {label}
                    </span>
                    <span className="text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>

              {status && <p className="mt-4 text-sm font-semibold text-blue-400">{status}</p>}
            </div>

            <div className={`rounded-[2rem] p-6 ${card}`}>
              <h2 className="text-xl font-black">Ask a question</h2>
              <p className={`mt-2 text-sm ${soft}`}>
                Choose whether the host sees your name or Anonymous.
              </p>

              <form onSubmit={submitQuestion} className="mt-5 space-y-4">
                <label className={`flex items-center gap-2 text-sm ${soft}`}>
                  <input
                    type="checkbox"
                    checked={askAnonymously}
                    onChange={(e) => setAskAnonymously(e.target.checked)}
                    className="h-4 w-4 accent-blue-500"
                  />
                  Ask anonymously
                </label>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What should the presenter answer?"
                  className={`min-h-32 w-full resize-none rounded-2xl border p-4 outline-none ${input}`}
                  maxLength={700}
                />

                <div className={`rounded-2xl px-4 py-3 text-sm ${mutedBox}`}>
                  This question will be shown as{' '}
                  <span className="font-black">{askAnonymously ? 'Anonymous' : userName}</span>.
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-black text-white transition hover:bg-blue-400">
                  <Send className="h-5 w-5" />
                  Submit question
                </button>
              </form>
            </div>
          </div>

          <div className={`rounded-[2rem] p-6 ${card}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">My questions</h2>
              <span className={light ? 'rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700' : 'rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-slate-300'}>
                {myQuestions.length}
              </span>
            </div>

            {myQuestions.length ? (
              <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
                {myQuestions.map((q) => (
                  <div key={q.id} className={`rounded-2xl p-4 ${mutedBox}`}>
                    <span className={light ? 'mb-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200' : 'mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300'}>
                      {q.user_name || 'Anonymous'}
                    </span>
                    <p className="text-sm">{q.text}</p>
                    <p className={`mt-2 text-xs ${soft}`}>
                      Asked{' '}
                      {q.created_at
                        ? new Date(q.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'just now'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`rounded-2xl border border-dashed p-5 text-center text-sm ${light ? 'border-slate-200 text-slate-600' : 'border-white/15 text-slate-400'}`}>
                Questions you ask in this room will appear here so you can review them.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
