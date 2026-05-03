"use client";

import Logo from "./components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

        <div className="hidden lg:flex items-center justify-center">
          <div className="p-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Logo size={200} />
          </div>
        </div>

        <div>
          <p className="text-sm text-blue-300 mb-3">
            Live reactions • Anonymous questions • AI summaries
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Understand every room.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Engage every moment.
            </span>
          </h1>

          <p className="mt-4 text-slate-400">
            FeelPulse helps presenters read the room in real-time with live
            reactions, anonymous questions, and smart insights.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <div className="p-6 border border-white/10 rounded-2xl bg-white/5">
              <h3 className="font-semibold text-lg">Create your session</h3>
              <p className="text-sm text-slate-400 mt-1">
                Protect host dashboard with PIN
              </p>

              <button className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-xl">
                Create Session →
              </button>
            </div>

            <div className="p-6 border border-white/10 rounded-2xl bg-white/5">
              <h3 className="font-semibold text-lg">Join as participant</h3>
              <p className="text-sm text-slate-400 mt-1">
                Enter code from presenter
              </p>

              <button className="mt-4 w-full border border-white/20 py-3 rounded-xl">
                Join Room →
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
