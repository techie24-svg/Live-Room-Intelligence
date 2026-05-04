"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Moon, QrCode, Sparkles, Sun } from "lucide-react";

/* ✅ UPDATED: now accepts `light` */
function FeelPulseLogo({ size = 48, light = false }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        className="shrink-0 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]"
      >
        <defs>
          <linearGradient id="fp-ring-home" x1="18" y1="14" x2="104" y2="108">
            <stop stopColor="#16d9f5" />
            <stop offset="0.48" stopColor="#2f7cff" />
            <stop offset="1" stopColor="#b13df6" />
          </linearGradient>
          <linearGradient id="fp-pulse-home" x1="30" y1="50" x2="88" y2="50">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#d8f3ff" />
          </linearGradient>
        </defs>

        <path
          d="M60 14C34.6 14 14 32.9 14 56.2c0 23.4 20.6 42.3 46 42.3 6.8 0 13.2-1.3 18.9-3.8l23.1 12.1-7.4-23.6c7.1-7.3 11.4-16.7 11.4-27C106 32.9 85.4 14 60 14Z"
          stroke="url(#fp-ring-home)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#07111f"
        />

        <path
          d="M31 57H45L52 38L65 78L73 57H89"
          stroke="url(#fp-pulse-home)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="43" cy="78" r="5.5" fill="#21d07a" />
        <circle cx="58" cy="82" r="5.5" fill="#f5aa28" />
        <circle cx="73" cy="78" r="5.5" fill="#ff4965" />
      </svg>

      {/* ✅ FIXED TEXT COLOR */}
      <div className="leading-none">
        <div
          className={`text-2xl font-black tracking-tight ${
            light ? "text-slate-900" : "text-white"
          }`}
        >
          Feel
          <span className="bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-400">
          Live Room Intelligence
        </div>
      </div>
    </div>
  );
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
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

  const theme = light ? "bg-slate-50 text-slate-950" : "bg-[#020617] text-white";
  const shell = light
    ? "border-slate-200 bg-white/90 shadow-2xl shadow-slate-200/70"
    : "border-white/10 bg-white/[0.045] shadow-2xl shadow-blue-950/30";
  const card = light
    ? "border-slate-200 bg-white shadow-lg shadow-slate-200/60"
    : "border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20";
  const soft = light ? "text-slate-500" : "text-slate-400";

  return (
    <main className={`min-h-screen overflow-hidden px-4 py-5 transition-colors duration-500 md:px-6 md:py-6 ${theme}`}>
      <section className={`relative mx-auto min-h-[calc(100vh-48px)] max-w-7xl overflow-hidden rounded-[2rem] border ${shell}`}>
        
        <nav className="flex items-center justify-between px-5 py-5 md:px-8">
          {/* ✅ PASS light here */}
          <FeelPulseLogo size={48} light={light} />

          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${
              light
                ? "border-slate-200 bg-white text-slate-800"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {light ? "Dark" : "Light"}
          </button>
        </nav>

        {/* Rest of your UI unchanged */}
      </section>
    </main>
  );
}
