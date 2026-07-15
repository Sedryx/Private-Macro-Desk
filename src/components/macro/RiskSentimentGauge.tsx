import { ProbabilityBar } from "@/components/ui/ProbabilityBar";

const BANDS = [
  { max: 33, label: "Risk-off", colorClass: "bg-[var(--negative)]", textClass: "text-[var(--negative)]" },
  { max: 66, label: "Neutral", colorClass: "bg-[var(--warning)]", textClass: "text-[var(--warning)]" },
  { max: 100, label: "Risk-on", colorClass: "bg-[var(--positive)]", textClass: "text-[var(--positive)]" },
] as const;

export function RiskSentimentGauge({ score, generatedAt }: { score: number; generatedAt: string }) {
  const band = BANDS.find((entry) => score <= entry.max) ?? BANDS[BANDS.length - 1];

  return (
    <article className="desk-surface p-4">
      <p className="terminal-label">Risk sentiment // AI take · {formatGeneratedAt(generatedAt)}</p>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-[-0.03em] text-[#dfe4e0]">{score}</span>
        <span className={`text-[10px] font-semibold ${band.textClass}`}>{band.label}</span>
      </div>
      <div className="mt-3">
        <ProbabilityBar value={score} max={100} colorClass={band.colorClass} />
      </div>
      <div className="mt-1.5 flex justify-between text-[8px] uppercase tracking-[0.08em] text-[#56615c]">
        <span>Risk off</span>
        <span>Risk on</span>
      </div>
    </article>
  );
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/Zurich" }).format(
    new Date(value),
  );
}
