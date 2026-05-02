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

    const storedName = window.localStorage.getItem(`feelpulse-name:${roomCode}`) || window.localStorage.getItem('feelpulse-name') || '';
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
      const res = await fetch(`/api/questions?roomCode=${roomCode}&sessionId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.questions) setMyQuestions(data.questions);
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
    window.localStorage.setItem(`feelpulse-name:${roomCode}`, finalName);
    window.localStorage.setItem('feelpulse-name', finalName);

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
    const visibleName = askAnonymously ? 'Anonymous' : (userName || 'Anonymous');
    setQuestion('');
    setStatus('Question submitted');

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, text, userName: visibleName, sessionId }),
    });
    if (!res.ok) {
      setStatus('Could not submit question');
      return;
    }

    const data = await res.json();
    if (data.question) setMyQuestions((prev) => [data.question, ...prev]);
    setTimeout(() => setStatus(''), 1800);
  }

  const reactions = useMemo(() => [
    { type: 'engaged', label: 'Engaged', icon: Smile, emoji: '👍' },
    { type: 'neutral', label: 'Neutral', icon: Meh, emoji: '😐' },
    { type: 'lost', label: 'Lost', icon: Frown, emoji: '😵‍💫' },
  ], []);

  if (!userName) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room</p>
            <h1 className="mt-2 text-4xl font-bold">{roomCode}</h1>
            <p className="mt-3 text-slate-300">Enter your name or nickname before joining.</p>
          </div>

          <form onSubmit={joinRoom} className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-100"><UserRound className="h-6 w-6" /></div>
              <div>
                <h2 className="text-xl font-semibold">What should we call you?</h2>
                <p className="text-sm text-slate-400">You can still ask individual questions anonymously later.</p>
              </div>
            </div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name or nickname"
              maxLength={80}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-white placeholder:text-slate-500"
              autoFocus
            />
            <button
              disabled={joining}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining ? 'Joining...' : 'Continue'}
            </button>
          </form>

          {status && <div className="mt-5 rounded-2xl bg-rose-500/10 p-4 text-center text-rose-200">{status}</div>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room</p>
          <h1 className="mt-2 text-4xl font-bold">{roomCode}</h1>
          <p className="mt-3 text-slate-300">React honestly and submit questions as <span className="font-semibold text-white">{userName}</span>.</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <h2 className="mb-2 text-xl font-semibold">How are you feeling?</h2>
              <p className="mb-4 text-sm text-slate-400">One vote per device/session. Changing your choice updates your vote instead of adding another one.</p>
              <div className="grid gap-3">
                {reactions.map(({ type, label, icon: Icon, emoji }) => (
                  <button
                    key={type}
                    onClick={() => sendReaction(type)}
                    className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
                      selected === type ? 'border-blue-300 bg-blue-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-3 text-lg font-semibold">
                      <Icon className="h-6 w-6" /> {label}
                    </span>
                    <span className="text-3xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {status && <div className="rounded-2xl bg-emerald-400/10 p-4 text-center text-emerald-200">{status}</div>}
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Ask a question</h2>
                  <p className="mt-1 text-sm text-slate-400">Choose whether the host sees your name or Anonymous.</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={askAnonymously}
                    onChange={(e) => setAskAnonymously(e.target.checked)}
                    className="h-4 w-4 accent-blue-500"
                  />
                  Ask anonymously
                </label>
              </div>
              <form onSubmit={submitQuestion} className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What should the presenter answer?"
                  className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 p-4 text-white placeholder:text-slate-500"
                  maxLength={700}
                />
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                  This question will be shown as <span className="font-semibold text-white">{askAnonymously ? 'Anonymous' : userName}</span>.
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400">
                  <Send className="h-5 w-5" /> Submit question
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">My questions</h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">{myQuestions.length}</span>
              </div>

              {myQuestions.length ? (
                <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
                  {myQuestions.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <span className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{q.user_name || 'Anonymous'}</span>
                      <p className="text-sm text-slate-100">{q.text}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Asked {q.created_at ? new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">
                  Questions you ask in this room will appear here so you can review them.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
