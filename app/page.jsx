"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MessageSquareText,
  Moon,
  QrCode,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import FeelPulseLogo from "./components/FeelPulseLogo";

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function cleanRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 32);
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [hostPinInput, setHostPinInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [light, setLight] = useState(false);

  async function createSession() {
    const hostPin = hostPinInput.trim();

    if (!/^\d{4,12}$/.test(hostPin)) {
      setError("Set a host PIN using 4 to 12 numbers.");
      return;
    }

    setCreating(true);
    setError("");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const roomCode = makeRoomCode();

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, hostPin }),
      });

      if (res.ok) {
        const data = await res.json();

        if (typeof window !== "undefined") {
          localStorage.setItem(`hostPin:${roomCode}`, data.hostPin || hostPin);
        }

        router.push(`/presenter/${roomCode}`);
        return;
      }
    }

    setError("Could not create a unique session. Please try again.");
    setCreating(false);
  }

  async function joinSession(e) {
    e.preventDefault();

    setJoining(true);
    setError("");

    const roomCode = cleanRoomCode(joinCode);

    if (!roomCode) {
      setError("Enter a room code.");
      setJoining(false);
      return;
    }

    const res = await fetch(`/api/rooms?roomCode=${encodeURIComponent(roomCode)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      setError("That session code was not found. Check the presenter screen and try again.");
      setJoining(false);
      return;
    }

    router.push(`/room/${roomCode}`);
  }

  const theme = light
    ? "bg-slate-50 text-slate-950"
    : "bg-[#030816] text-white";

  const panel = light
    ? "border-slate-200 bg-white/85 shadow-xl shadow-slate-200/60"
    : "border-white/10 bg-white/[0.045] shadow-2xl shadow-blue-950/30";

  const muted = light ? "text-slate-600" : "text-slate-300";

  return (
    <main className={`min-h-screen overflow-hidden px-5 py-6 transition-colors duration-300 ${theme}`}>
      <div
        className={`pointer-events-none fixed inset-0 ${
          light
            ? "bg-[radial-gradient(circle_at_18%_38%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(168,85,247,0.16),transparent_30%)]"
            : "bg-[radial-gradient(circle_at_18%_35%,rgba(14,165,233,0.22),transparent_28%),radial-gradient(circle_at_84%_70%,rgba(168,85,247,0.18),transparent_32%)]"
        }`}
      />

      <section className={`relative mx-auto max-w-7xl rounded-[2rem] border p-5 md:p-8 ${panel}`}>
        <nav className="flex items-center justify-between gap-4">
          <FeelPulseLogo size={50} showText />

          <div className="hidden items-center gap-9 text-sm font-medium text-slate-300 md:flex">
            <span className={light ? "text-slate-600" : ""}>Features</span>
            <span className={light ? "text-slate-600" : ""}>How it works</span>
            <span className={light ? "text-slate-600" : ""}>About</span>
          </div>

          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${
              light
                ? "border-slate-200 bg-white text-slate-800"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {light ? "Dark" : "Light"}
          </button>
        </nav>

        <div className="grid min-h-[680px] items-center gap-10 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
          <div className="relative flex items-center justify-center lg:justify-start">
            <div className="absolute h-80 w-80 rounded-full bg-gradient-to-br from-sky-500/20 via-blue-600/10 to-fuchsia-500/20 blur-3xl" />

            <div className={`relative rounded-[2rem] border p-8 ${light ? "border-slate-200 bg-white/70" : "border-white/10 bg-slate-950/35"}`}>
              <FeelPulseLogo size={250} showText={false} />

              <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  ["Live", "Reactions"],
                  ["Anon", "Questions"],
                  ["AI", "Summaries"],
                ].map(([a, b]) => (
                  <div
                    key={a}
                    className={`rounded-2xl border px-3 py-4 ${
                      light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="font-bold text-sky-400">{a}</div>
                    <div className={muted}>{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div
              className={`mb-8 inline-flex rounded-full border px-5 py-2 text-sm font-bold ${
                light ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              Live reactions • Anonymous questions • AI summaries
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Understand every room.
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                Engage every moment.
              </span>
            </h1>

            <p className={`mt-7 max-w-3xl text-lg leading-8 md:text-xl ${muted}`}>
              FeelPulse helps presenters and educators read the room in real time with live
              reactions, anonymous questions, and smart session summaries.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className={`rounded-[1.75rem] border p-6 ${light ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/70"}`}>
                <div className="mb-3 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                  <h2 className="text-2xl font-black">Create your session</h2>
                </div>

                <p className={`text-sm ${muted}`}>Protect the host dashboard with a PIN.</p>

                <input
                  value={hostPinInput}
                  onChange={(e) => setHostPinInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Create 4-12 digit PIN"
                  inputMode="numeric"
                  className={`mt-6 w-full rounded-2xl border p-4 text-center text-lg font-bold tracking-[0.18em] outline-none ${
                    light
                      ? "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400"
                      : "border-white/10 bg-slate-950 text-white placeholder:text-slate-600"
                  }`}
                />

                <button
                  onClick={createSession}
                  disabled={creating}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Session"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={joinSession}
                className={`rounded-[1.75rem] border p-6 ${light ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/70"}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-fuchsia-400" />
                  <h2 className="text-2xl font-black">Join as participant</h2>
                </div>

                <p className={`text-sm ${muted}`}>Enter the room code from the presenter.</p>

                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className={`mt-6 w-full rounded-2xl border p-4 text-center text-2xl font-black uppercase tracking-[0.25em] outline-none ${
                    light
                      ? "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400"
                      : "border-white/10 bg-slate-950 text-white placeholder:text-slate-600"
                  }`}
                />

                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/70 px-5 py-4 font-black transition hover:bg-fuchsia-500/10">
                  {joining ? "Joining..." : "Join Room"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [Users, "Separate sessions", "Multiple hosts can run rooms at the same time."],
                [MessageSquareText, "Anonymous Q&A", "Participants can choose name or Anonymous per question."],
                [Sparkles, "AI insights", "Gemini summarizes key questions and themes."],
              ].map(([Icon, title, body]) => (
                <div
                  key={title}
                  className={`rounded-2xl border p-4 ${
                    light ? "border-slate-200 bg-white/70" : "border-white/10 bg-white/5"
                  }`}
                >
                  <Icon className="mb-3 h-5 w-5 text-sky-400" />
                  <h3 className="font-black">{title}</h3>
                  <p className={`mt-1 text-sm ${muted}`}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
