import { CurrencyVolatilityChart } from "@/components/macro/CurrencyVolatilityChart";
import { MacroDriversCard } from "@/components/macro/MacroDriversCard";
import { MacroScenarioCard } from "@/components/macro/MacroScenarioCard";
import { RiskSentimentGauge } from "@/components/macro/RiskSentimentGauge";
import { WorldClockStrip } from "@/components/macro/WorldClockStrip";
import type { DailyMacroBriefView } from "@/lib/ai/dailyBrief";
import type { CurrencyVolatilitySeries } from "@/lib/data/currencyVolatility.server";
import type { CountryMacroProfile } from "@/lib/macroProfiles";

export function GlobalMacroOverview({
  profiles,
  dailyBrief,
  currencySeries,
}: {
  profiles: CountryMacroProfile[];
  dailyBrief: DailyMacroBriefView | null;
  currencySeries: CurrencyVolatilitySeries[];
}) {
  return (
    <section className="space-y-3">
      <WorldClockStrip />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="terminal-label">Cross-country monitor // Policy</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[#e7ebe8]">Global policy board</h2>
        </div>
      </div>

      {dailyBrief ? (
        <>
          <article className="desk-surface p-4">
            <p className="terminal-label">Daily recap // AI take · {formatGeneratedAt(dailyBrief.generatedAt)}</p>
            <p className="mt-3 text-[12px] leading-5 text-[#c2c9c4]">{dailyBrief.recap}</p>
          </article>
          <div className="grid gap-3 lg:grid-cols-3">
            <MacroDriversCard drivers={dailyBrief.drivers} generatedAt={dailyBrief.generatedAt} />
            <MacroScenarioCard scenarios={dailyBrief.scenarios} generatedAt={dailyBrief.generatedAt} />
            <RiskSentimentGauge score={dailyBrief.riskSentimentScore} generatedAt={dailyBrief.generatedAt} />
          </div>
        </>
      ) : (
        <div className="desk-surface px-5 py-8 text-center text-[11px] text-[#6f7a75]">
          AI daily brief not generated yet — set <span className="mx-1 font-mono text-[#9aa49f]">GEMINI_API_KEY</span> and wait
          for the next sync, or run <span className="mx-1 font-mono text-[#9aa49f]">npm run data:ai:brief</span>.
        </div>
      )}

      <article className="desk-surface p-4">
        <p className="terminal-label">Currency volatility // 30D, indexed</p>
        <div className="mt-3">
          <CurrencyVolatilityChart series={currencySeries} />
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {profiles.map((profile) => (
          <article key={profile.id} className="desk-surface overflow-hidden p-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-[#e2e7e3]">{profile.country}</h3>
              <p className="mt-1 text-[9px] text-[#68736e]">{profile.centralBank}</p>
            </div>
            <dl className="mt-5 space-y-2.5 border-t border-[var(--line)] pt-3">
              {profile.snapshot.map((item) => (
                <Row key={item.label} item={item} />
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Row({ item }: { item: CountryMacroProfile["snapshot"][number] }) {
  const trend = changeTrend(item.change);
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[9px] text-[#626d68]">{item.label}</dt>
      <dd className="flex items-center gap-1.5 text-right text-[10px] font-medium text-[#b9c1bc]">
        {item.stale ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" title="Stale data" /> : null}
        <span>{item.value}</span>
        {trend ? <span className="text-[8px] text-[#7c8680]">{trend}</span> : null}
      </dd>
    </div>
  );
}

function changeTrend(change?: string) {
  if (!change || change === "Flat") return null;
  return change.startsWith("-") ? "▼" : "▲";
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  }).format(new Date(value));
}
