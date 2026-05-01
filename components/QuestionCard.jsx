export default function QuestionCard({ question }) {
  const time = question?.created_at ? new Date(question.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-slate-100">{question.text}</p>
      <p className="mt-2 text-xs text-slate-500">{time}</p>
    </div>
  );
}
