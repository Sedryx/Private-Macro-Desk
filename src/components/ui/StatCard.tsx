type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative";
};

const toneClasses = {
  neutral: "text-blue-300",
  positive: "text-emerald-300",
  negative: "text-rose-300",
};

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/55 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
