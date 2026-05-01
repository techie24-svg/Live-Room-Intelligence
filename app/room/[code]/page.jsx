'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Smile, Meh, Frown, UserRound } from 'lucide-react';

import { getOrCreateSessionId } from '@/lib/session';

function nameKey(roomCode) {
  return `participantName:${roomCode}`;
}

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

export default function AudienceRoom({ params }) {
  const roomCode = params.code;
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    setSessionId(getOrCreateSessionId(`voter:${roomCode}`));

    const savedName = cleanName(window.localStorage.getItem(nameKey(roomCode)));
    if (savedName) {
      setParticipantName(savedName);
      setNameDraft(savedName);
    }
  }, [roomCode]);

  function saveName(e) {
    e.preventDefault();
    const nextName = cleanName(nameDraft);

    if (!nextName) {
      setStatus('Please enter your name or nickname.');
      return;
    }

    window.localStorage.setItem(nameKey(roomCode), nextName);
    setParticipantName(nextName);
    setNameDraft(nextName);
    setStatus('Name saved');
    setTimeout(() => setStatus(''), 1200);
  }

  function requireName() {
    if (participantName) return true;
    setStatus('Please enter your name first.');
    return false;
  }

  async function sendReaction(type) {
    if (!requireName()) return;

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
    if (!requireName()) return;
    if (!question.trim()) return;

    const text = question.trim();
    setQuestion('');
    setStatus('Question submitted');

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, text, userName: participantName }),
    });

    if (!res.ok) setStatus('Could not submit question');
    setTimeout(() => setStatus(''), 1800);
  }

  const reactions = useMemo(() => [
    { type: 'engaged', label: 'Engaged', icon: Smile, emoji: '👍' },
    { type: 'neutral', label: 'Neutral', icon: Meh, emoji: '😐' },
    { type: 'lost', label: 'Lost', icon: Frown, emoji: '😵‍💫' },
  ], []);

  if (!participantName) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room</p>
            <h1 className="mt-2 text-4xl font-bold">{roomCode}</h1>
            <p className="mt-3 text-slate-300">Enter your name or nickname to join this session.</p>

            <form onSubmit={saveName} className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <UserRound className="h-4 w-4" /> Your name or nickname
              </label>
              <div className="flex gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={40}
                  autoFocus
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500"
                />
                <button className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400">
                  Join
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">This name will appear with your questions.</p>
            </form>

            {status && <div className="mt-5 rounded-2xl bg-emerald-400/10 p-4 text-center text-emerald-200">{status}</div>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room</p>
          <h1 className="mt-2 text-4xl font-bold">{roomCode}</h1>
          <p className="mt-3 text-slate-300">React honestly and submit questions.</p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <UserRound className="h-4 w-4" /> Joined as <span className="font-semibold text-slate-200">{participantName}</span>
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
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
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
          <h2 className="mb-4 text-xl font-semibold">Ask a question</h2>
          <form onSubmit={submitQuestion} className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should the presenter answer?"
              className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 p-4 text-white placeholder:text-slate-500"
              maxLength={700}
            />
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400">
              <Send className="h-5 w-5" /> Submit question
            </button>
          </form>
        </section>

        {status && <div className="mt-5 rounded-2xl bg-emerald-400/10 p-4 text-center text-emerald-200">{status}</div>}
      </div>
    </main>
  );
}
