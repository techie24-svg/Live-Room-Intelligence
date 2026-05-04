"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Moon, QrCode, Sparkles, Sun } from "lucide-react";

function FeelPulseLogo({ size = 44 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="120" y2="120">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <path
          d="M20 20h80v50a15 15 0 0 1-15 15H55l-20 12v-12H35a15 15 0 0 1-15-15V20z"
          stroke="url(#g)"
          strokeWidth="5"
        />

        <path
          d="M30 55h15l5-12 12 24 6-12h20"
          stroke="url(#g)"
          strokeWidth="5"
        />
      </svg>

      <div className="font-bold text-lg">
        Feel<span className="text-purple-400">Pulse</span>
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
    .replace(/[^A-Z0-9]/g, "");
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
      headers: {
        "Content-Type": "application/json",
      },
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

  const theme = light
    ? "bg-white text-black"
    : "bg-[#020617] text-white";

  const card = light
    ? "bg-white border border-gray-200"
    : "bg-white/5 border border-white/10";

  return (
    <main className={`min-h-screen px-6 py-6 ${theme}`}>
      {/* NAV */}
      <div className="flex justify-between items-center mb-16">
        <FeelPulseLogo />

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
