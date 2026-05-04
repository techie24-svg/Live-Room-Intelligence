"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Moon, QrCode, Sparkles, Sun } from "lucide-react";

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
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function cleanRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

export default function Home() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [hostPin, setHostPin] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [light, setLight] = useState(false);

  async function createSession() {
    if (!/^\d{4,12}$/.test(hostPin)) {
      setError("Enter 4–12 digit PIN");
      return;
    }

    setCreating(true);
    setError("");

    const roomCode = makeRoomCode();

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, hostPin }),
    });

    if (res.ok) {
      localStorage.setItem(`hostPin:${roomCode}`, hostPin);
      router.push(`/presenter/${roomCode}`);
    } else {
      setError("Failed to create session");
      setCreating(false);
    }
  }

  async function joinSession(e) {
    e.preventDefault();
    setJoining(true);
    setError("");

    const code = cleanRoomCode(joinCode);

    if (!code) {
      setError("Enter a valid code");
      setJoining(false);
      return;
    }

    const res = await fetch(`/api/rooms?roomCode=${code}`);

    if (!res.ok) {
      setError("Room not found");
      setJoining(false);
      return;
    }

    router.push(`/room/${code}`);
  }

  const theme = light ? "bg-white text-black" : "bg-[#020617] text-white";
  const card = light
    ? "bg-white border border-gray-200"
    : "bg-white/5 border border-white/10";

  return (
    <main className={`min-h-screen px-6 py-6 ${theme}`}>
      {/* NAV */}
      <div className="flex justify-between items-center mb-16">
        <FeelPulseLogo light={light} />

        <button
          onClick={() => setLight(!light)}
          className="px-4 py-2 rounded-xl border"
        >
          {light ? <Moon /> : <Sun />}
        </button>
      </div>

      {/* HERO */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
          Understand every room.
          <br />
          <span className="text-purple-400">
            Engage every moment.
          </span>
        </h1>
      </div>

      {/* ACTION CARDS */}
      <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* CREATE */}
        <div className={`p-6 rounded-2xl ${card}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles />
            <h2 className="text-xl font-semibold">Create session</h2>
          </div>

          <input
            placeholder="Enter PIN"
            value={hostPin}
            onChange={(e) => setHostPin(e.target.value)}
            className="w-full p-3 rounded-xl bg-transparent border mb-4 text-center"
          />

          <button
            onClick={createSession}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-xl"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>

        {/* JOIN */}
        <form onSubmit={joinSession} className={`p-6 rounded-2xl ${card}`}>
          <div className="flex items-center gap-2 mb-4">
            <QrCode />
            <h2 className="text-xl font-semibold">Join room</h2>
          </div>

          <input
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full p-3 rounded-xl bg-transparent border mb-4 text-center"
          />

          <button className="w-full border py-3 rounded-xl">
            {joining ? "Joining..." : "Join"}
          </button>
        </form>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-center mt-6 text-red-400">
          {error}
        </div>
      )}
    </main>
  );
}
