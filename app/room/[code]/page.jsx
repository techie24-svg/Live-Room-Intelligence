'use client';

import { useState } from 'react';
import { Send, Smile, Meh, Frown } from 'lucide-react';

export default function AudienceRoom({ params }) {
  const roomCode = params.code;
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  async function sendReaction(type) {
    setSelected(type);
    setStatus('Reaction sent');
    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, type }),
    });
    setTimeout(() => setStatus(''), 1400);
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!question.trim()) return;
    const text = question.trim();
    setQuestion('');
    setStatus('Question submitted');
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, text }),
    });
    if (!res.ok) setStatus('Could not submit question');
    setTimeout(() => setStatus(''), 1800);
  }

  const reactions = [
    { type: 'engaged', label: 'Engaged', icon: Smile, emoji: '👍' },
    { type: 'neutral', label: 'Neutral', icon: Meh, emoji: '😐' },
    { type: 'lost', label: 'Lost', icon: Frown, emoji: '😵‍💫' },
  ];

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room</p>
          <h1 className="mt-2 text-4xl font-bold">{roomCode}</h1>
          <p className="mt-3 text-slate-300">React honestly and submit anonymous questions.</p>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
          <h2 className="mb-4 text-xl font-semibold">How are you feeling?</h2>
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
              <Send className="h-5 w-5" /> Submit anonymously
            </button>
          </form>
        </section>

        {status && <div className="mt-5 rounded-2xl bg-emerald-400/10 p-4 text-center text-emerald-200">{status}</div>}
      </div>
    </main>
  );
}
