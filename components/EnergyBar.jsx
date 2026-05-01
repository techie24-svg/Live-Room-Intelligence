export default function EnergyBar({ totals }) {
  const engaged = totals?.engaged || 0;
  const neutral = totals?.neutral || 0;
  const lost = totals?.lost || 0;
  const total = engaged + neutral + lost;
  const engagedPct = total ? Math.round((engaged / total) * 100) : 0;
  const neutralPct = total ? Math.round((neutral / total) * 100) : 0;
  const lostPct = total ? Math.round((lost / total) * 100) : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Room Energy</p>
          <h2 className="text-3xl font-bold">{engagedPct}% engaged</h2>
        </div>
        <div className="energy-pulse flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-3xl">
          ⚡
        </div>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${engagedPct}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-emerald-400/10 p-4">
          <p className="text-2xl font-bold">{engaged}</p>
          <p className="text-sm text-slate-300">Engaged · {engagedPct}%</p>
        </div>
        <div className="rounded-2xl bg-yellow-400/10 p-4">
          <p className="text-2xl font-bold">{neutral}</p>
          <p className="text-sm text-slate-300">Neutral · {neutralPct}%</p>
        </div>
        <div className="rounded-2xl bg-rose-400/10 p-4">
          <p className="text-2xl font-bold">{lost}</p>
          <p className="text-sm text-slate-300">Lost · {lostPct}%</p>
        </div>
      </div>
    </div>
  );
}
