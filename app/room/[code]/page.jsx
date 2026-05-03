'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Smile, Meh, Frown, UserRound } from 'lucide-react';
import { getOrCreateSessionId } from '@/lib/session';

export default function AudienceRoom({ params }) {
  const roomCode = params.code;

  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [myQuestions, setMyQuestions] = useState([]);
  const [askAnonymously, setAskAnonymously] = useState(false);

  useEffect(() => {
    const id = getOrCreateSessionId(`voter:${roomCode}`);
    setSessionId(id);

    // Name is now stored per room/session.
    // This forces attendee to enter name again for each new room.
    const storedName = window.localStorage.getItem(`feelpulse-name:${roomCode}`) || '';

    if (storedName) {
      setUserName(storedName);
      setNameInput(storedName);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !sessionId || !userName) return;

    fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, sessionId, userName }),
    }).catch(() => {});
  }, [roomCode, sessionId, userName]);

  async function loadMyQuestions(id = sessionId) {
    if (!roomCode || !id) return;

    try {
      const res = await fetch(
        `/api/questions?roomCode=${roomCode}&sessionId=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (data.questions) {
        setMyQuestions(data.questions);
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (!roomCode || !sessionId || !userName) return;
    loadMyQuestions(sessionId);
  }, [roomCode, sessionId, userName]);

  async function joinRoom(e) {
    e.preventDefault();

    const finalName = nameInput.trim() || 'Anonymous';

    if (!sessionId) {
      setStatus('Preparing your session. Please try again.');
      return;
    }

    setJoining(true);
    setStatus('');

    // Store only for this room. Do NOT store global name.
    window.localStorage.setItem(`feelpulse-name:${roomCode}`, finalName);

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, sessionId, userName: finalName }),
      });

      if (!res.ok) {
        throw new Error('Could not join room');
      }

      setUserName(finalName);
      await loadMyQuestions(sessionId);
    } catch (err) {
      setStatus(err.message || 'Could not join room');
    } finally {
      setJoining(false);
    }
  }

  async function sendReaction(type) {
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
      setStatus('Could not save vote');
      return;
    }

    setTimeout(() => setStatus(''), 1400);
  }

  async function submitQuestion(e) {
    e.preventDefault();

    if (!question.trim()) return;

    const text = question.trim();
    const visibleName = askAnonymously ? 'Anonymous' : userName || 'Anonymous';

    setQuestion('');
    setStatus('Question submitted');

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode,
        text,
        userName: visibleName,
        sessionId,
      }),
    });

    if (!res.ok) {
      setStatus('Could not submit question');
      return;
    }

    const data = await res.json();

    if (data.question) {
      setMyQuestions((prev) => [data.question, ...prev]);
    }

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

  if (!userName) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <form
            onSubmit={joinRoom}
            className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
                <UserRound className="h-6 w-6 text-blue-300" />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">
                  FeelPulse
                </p>
                <h1 className="text-2xl font-bold">Join the room</h1>
              </div>
            </div>

            <p className="mb-5 text-sm text-slate-300">
              Enter your name or nickname before joining. You can still ask
              individual questions anonymously later.
            </p>

            <label className="mb-2 block text-sm font-medium text-slate-200">
              What should we call you?
            </label>

            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name or nickname"
              maxLength={80}
              className="mb-4 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-white placeholder:text-slate-500"
              autoFocus
            />

            <button
              type="submit"
              disabled={joining}
              className="w-full rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining ? 'Joining...' : 'Continue'}
            </button>

            {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">
            FeelPulse
          </p>
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
          <p className="mt-2 text-slate-400">
            React honestly and submit questions as {userName}.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">How are you feeling?</h2>
              <p className="mt-2 text-sm text-slate-400">
                One vote per device/session. Changing your choice updates your
                vote instead of adding another one.
              </p>

              <div className="mt-5 grid gap-3">
                {reactions.map(({ type, label, icon: Icon, emoji }) => (
                  <button
                    key={type}
                    onClick={() => sendReaction(type)}
                    className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
                      selected === type
                        ? 'border-blue-300 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {label}
                    </span>
                    <span className="text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>

              {status && <p className="mt-4 text-sm text-blue-200">{status}</p>}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Ask a question</h2>
              <p className="mt-2 text-sm text-slate-400">
                Choose whether the host sees your name or Anonymous.
              </p>

              <form onSubmit={submitQuestion} className="mt-5 space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
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
                  className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 p-4 text-white placeholder:text-slate-500"
                  maxLength={700}
                />

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                  This question will be shown as{' '}
                  <span className="font-semibold text-white">
                    {askAnonymously ? 'Anonymous' : userName}
                  </span>
                  .
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400">
                  <Send className="h-5 w-5" />
                  Submit question
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">My questions</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                {myQuestions.length}
              </span>
            </div>

            {myQuestions.length ? (
              <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
                {myQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <span className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      {q.user_name || 'Anonymous'}
                    </span>

                    <p className="text-sm text-slate-100">{q.text}</p>

                    <p className="mt-2 text-xs text-slate-500">
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
              <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">
                Questions you ask in this room will appear here so you can
                review them.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
