import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import type { DriverPayload } from "@/lib/ai/dailyBrief";

const DIRECTION_COLOR: Record<DriverPayload["direction"], string> = {
  BULLISH: "bg-[var(--positive)]",
  BEARISH: "bg-[var(--negative)]",
  NEUTRAL: "bg-[#8a8a8a]",
};

export function MacroDriversCard({ drivers, generatedAt }: { drivers: DriverPayload[]; generatedAt: string }) {
  return (
    <article className="desk-surface p-4">
      <p className="terminal-label">Macro drivers // AI take · {formatGeneratedAt(generatedAt)}</p>
      <div className="mt-4 space-y-4">
        {drivers.map((driver) => (
          <div key={driver.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-[#dfe4e0]">{driver.label}</span>
              <span className="text-[10px] font-semibold text-[#aab2ae]">{driver.weight}%</span>
            </div>
            <ProbabilityBar value={driver.weight} max={100} colorClass={DIRECTION_COLOR[driver.direction]} />
            <p className="mt-1.5 text-[10px] leading-4 text-[#78827e]">{driver.reasoning}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/Zurich" }).format(
    new Date(value),
  );
}
