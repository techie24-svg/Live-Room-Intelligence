import Link from 'next/link';

export default function Home() {
  const defaultRoom = 'townhall-demo';
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-blue-200">Live Room Intelligence</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            See room energy and questions in real time.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            A townhall companion app with audience reactions, anonymous questions, and Gemini-powered summaries.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href={`/presenter/${defaultRoom}`} className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-semibold text-white transition hover:bg-blue-400">
              Open Presenter Dashboard
            </Link>
            <Link href={`/room/${defaultRoom}`} className="rounded-2xl border border-white/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/10">
              Open Audience Page
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Audience reacts', 'People tap Engaged, Neutral, or Lost from their phone.'],
            ['2', 'Questions flow in', 'Anonymous questions appear on the presenter dashboard.'],
            ['3', 'Gemini summarizes', 'One click produces themes, top questions, and an executive-ready summary.'],
          ].map(([num, title, body]) => (
            <div key={num} className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-200">{num}</div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
