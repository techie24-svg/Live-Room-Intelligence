export default function Logo({ size = 120 }) {
  return (
    <div style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#22c1c3" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <path
          d="M20 20h60v40a10 10 0 0 1-10 10H45l-15 10v-10H30a10 10 0 0 1-10-10V20z"
          stroke="url(#grad)"
          strokeWidth="3"
        />

        <path
          d="M25 45h10l5-10 10 20 5-10h15"
          stroke="url(#grad)"
          strokeWidth="3"
        />

        <circle cx="35" cy="65" r="2" fill="#22c55e" />
        <circle cx="45" cy="65" r="2" fill="#f59e0b" />
        <circle cx="55" cy="65" r="2" fill="#ef4444" />
      </svg>
    </div>
  );
}
