export default function FeelPulseLogo({ size = 'md', showText = true, className = '' }) {
  const iconSize = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  const textSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`${iconSize} relative shrink-0`}>
        <svg viewBox="0 0 128 128" className="h-full w-full drop-shadow-[0_0_22px_rgba(56,189,248,0.35)]" role="img" aria-label="FeelPulse logo">
          <defs>
            <linearGradient id="fp-ring" x1="14" y1="14" x2="112" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="0.48" stopColor="#2563eb" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="fp-pulse" x1="22" y1="60" x2="98" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>
          <path d="M64 13c-27.6 0-50 19.8-50 44.4 0 13.7 7 26 18 34.1l-5.4 21.2 23-11.8c4.6 1.1 9.4 1.7 14.4 1.7 27.6 0 50-19.8 50-45.2S91.6 13 64 13Z" fill="#020617" stroke="url(#fp-ring)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 62h25l8-25 14 50 8-25h18" fill="none" stroke="url(#fp-pulse)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="43" cy="84" r="5.5" fill="#22c55e" />
          <circle cx="62" cy="90" r="5.5" fill="#f59e0b" />
          <circle cx="82" cy="84" r="5.5" fill="#f43f5e" />
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <div className={`${textSize} font-black tracking-tight text-[var(--fp-text)]`}>
            Feel<span className="bg-gradient-to-r from-sky-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">Pulse</span>
          </div>
          {size === 'lg' && <div className="mt-3 text-sm font-semibold uppercase tracking-[0.38em] text-[var(--fp-muted)]">Live Room Intelligence</div>}
        </div>
      )}
    </div>
  );
}
