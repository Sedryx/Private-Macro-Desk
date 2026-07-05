type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative";
};

const toneClasses = {
  neutral: "text-[#d8ddda]",
  positive: "text-[#afbea5]",
  negative: "text-[#c99b96]",
};

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
  return (
    <article className="desk-surface p-5">
      <p className="text-[11px] font-medium text-[#7f8985]">{label}</p>
      <p className={`mt-3 text-xl font-semibold tracking-[-0.025em] ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[#68736e]">{detail}</p>
    </article>
  );
}
