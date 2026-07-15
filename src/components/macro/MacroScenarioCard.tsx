import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import type { ScenarioPayload } from "@/lib/ai/dailyBrief";

const ROWS: { key: "bull" | "base" | "bear"; label: string; colorClass: string }[] = [
  { key: "bull", label: "Bull case", colorClass: "bg-[var(--positive)]" },
  { key: "base", label: "Base case", colorClass: "bg-[#d4d4d4]" },
  { key: "bear", label: "Bear case", colorClass: "bg-[var(--negative)]" },
];

export function MacroScenarioCard({
  scenarios,
  generatedAt,
}: {
  scenarios: { base: ScenarioPayload; bull: ScenarioPayload; bear: ScenarioPayload };
  generatedAt: string;
}) {
  return (
    <article className="desk-surface p-4">
      <p className="terminal-label">Macro scenario // AI take · {formatGeneratedAt(generatedAt)}</p>
      <div className="mt-4 space-y-4">
        {ROWS.map((row) => {
          const scenario = scenarios[row.key];
          return (
            <div key={row.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-[#dfe4e0]">
                  {row.label} · {scenario.headline}
                </span>
                <span className="text-[10px] font-semibold text-[#aab2ae]">{scenario.probability}%</span>
              </div>
              <ProbabilityBar value={scenario.probability} max={100} colorClass={row.colorClass} />
              <p className="mt-1.5 text-[10px] leading-4 text-[#78827e]">{scenario.detail}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/Zurich" }).format(
    new Date(value),
  );
}
