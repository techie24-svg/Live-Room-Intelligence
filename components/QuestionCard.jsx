export default function QuestionCard({ question }) {
  const time = question?.created_at ? new Date(question.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const name = question?.user_name || 'Anonymous';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-blue-100">{name}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
      <p className="text-slate-100">{question.text}</p>
    </div>
  );
}
