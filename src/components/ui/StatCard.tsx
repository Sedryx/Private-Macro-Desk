type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative";
};

const toneClasses = {
  neutral: "text-[#f0f0f0]",
  positive: "text-[var(--positive)]",
  negative: "text-[var(--negative)]",
};

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
  return (
    <article className="desk-surface p-4">
      <p className="terminal-label">{label}</p>
      <p className={"mt-2 text-[22px] font-semibold tracking-[-0.03em] tabular-nums " + toneClasses[tone]}>
        {value}
      </p>
      <p className="mt-1.5 truncate text-[10px] text-[#686868]">{detail}</p>
    </article>
  );
}
