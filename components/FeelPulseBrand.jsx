"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "feelpulse-theme";

export function usePersistentTheme() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    setLight(saved === "light");
  }, []);

  function toggleTheme() {
    setLight((current) => {
      const next = !current;
      window.localStorage.setItem(THEME_KEY, next ? "light" : "dark");
      return next;
    });
  }

  return {
    light,
    toggleTheme,
    pageClass: light ? "fp-light bg-slate-50 text-slate-950" : "bg-[#020617] text-white",
  };
}

export function FeelPulseBrand({ light = false, size = 44, subtitle = "Live Room Intelligence" }) {
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
          <linearGradient id="fp-brand-ring" x1="18" y1="14" x2="104" y2="108">
            <stop stopColor="#16d9f5" />
            <stop offset="0.48" stopColor="#2f7cff" />
            <stop offset="1" stopColor="#b13df6" />
          </linearGradient>
          <linearGradient id="fp-brand-pulse" x1="30" y1="50" x2="88" y2="50">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#d8f3ff" />
          </linearGradient>
        </defs>
        <path
          d="M60 14C34.6 14 14 32.9 14 56.2c0 23.4 20.6 42.3 46 42.3 6.8 0 13.2-1.3 18.9-3.8l23.1 12.1-7.4-23.6c7.1-7.3 11.4-16.7 11.4-27C106 32.9 85.4 14 60 14Z"
          stroke="url(#fp-brand-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#07111f"
        />
        <path
          d="M31 57H45L52 38L65 78L73 57H89"
          stroke="url(#fp-brand-pulse)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="43" cy="78" r="5.5" fill="#21d07a" />
        <circle cx="58" cy="82" r="5.5" fill="#f5aa28" />
        <circle cx="73" cy="78" r="5.5" fill="#ff4965" />
      </svg>

      <div className="leading-none">
        <div className={`text-2xl font-black tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
          Feel
          <span className="bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
        {subtitle ? (
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-400">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ThemeToggle({ light, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 ${
        light
          ? "border-slate-200 bg-white text-slate-800 shadow-sm"
          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {light ? "Dark" : "Light"}
    </button>
  );
}

export function LightThemeStyles() {
  return (
    <style jsx global>{`
      .fp-light .bg-white\/10,
      .fp-light .bg-slate-950\/50,
      .fp-light .bg-slate-950\/60,
      .fp-light .bg-slate-900\/70,
      .fp-light .bg-white\/5 {
        background-color: rgba(255, 255, 255, 0.86) !important;
      }

      .fp-light .bg-slate-900,
      .fp-light .bg-\[\#030816\] {
        background-color: rgb(248, 250, 252) !important;
      }

      .fp-light .border-white\/10,
      .fp-light .border-white\/15 {
        border-color: rgb(226, 232, 240) !important;
      }

      .fp-light .text-white,
      .fp-light .text-slate-100,
      .fp-light .text-slate-200 {
        color: rgb(15, 23, 42) !important;
      }

      .fp-light .text-slate-300,
      .fp-light .text-slate-400,
      .fp-light .text-slate-500 {
        color: rgb(71, 85, 105) !important;
      }

      .fp-light input,
      .fp-light textarea {
        color: rgb(15, 23, 42) !important;
      }
    `}</style>
  );
}
