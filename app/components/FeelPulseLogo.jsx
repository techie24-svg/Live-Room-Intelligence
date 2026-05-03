export default function FeelPulseLogo({ size = 56, showText = true }) {
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
          <linearGradient id="fp-ring" x1="18" y1="14" x2="104" y2="108">
            <stop stopColor="#16d9f5" />
            <stop offset="0.48" stopColor="#2f7cff" />
            <stop offset="1" stopColor="#b13df6" />
          </linearGradient>
          <linearGradient id="fp-pulse" x1="30" y1="50" x2="88" y2="50">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#d8f3ff" />
          </linearGradient>
        </defs>

        <path
          d="M60 14C34.6 14 14 32.9 14 56.2c0 23.4 20.6 42.3 46 42.3 6.8 0 13.2-1.3 18.9-3.8l23.1 12.1-7.4-23.6c7.1-7.3 11.4-16.7 11.4-27C106 32.9 85.4 14 60 14Z"
          stroke="url(#fp-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#07111f"
        />

        <path
          d="M31 57H45L52 38L65 78L73 57H89"
          stroke="url(#fp-pulse)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="43" cy="78" r="5.5" fill="#21d07a" />
        <circle cx="58" cy="82" r="5.5" fill="#f5aa28" />
        <circle cx="73" cy="78" r="5.5" fill="#ff4965" />
      </svg>

      {showText && (
        <div className="leading-none">
          <div className="text-2xl font-black tracking-tight text-white">
            Feel<span className="bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent">Pulse</span>
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-400">
            Live Room Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
