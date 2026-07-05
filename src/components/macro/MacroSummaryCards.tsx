import type { MacroIndicatorView } from "@/components/macro/MacroIndicatorCard";

export function MacroSummaryCards({ indicators }: { indicators: MacroIndicatorView[] }) {
  const fedFunds = findIndicator(indicators, "FEDFUNDS");
  const inflation = findIndicator(indicators, "US_CPI");
  const unemployment = findIndicator(indicators, "US_UNEMPLOYMENT");
  const ecb = findIndicator(indicators, "ECB_DEPOSIT_RATE");
  const snb = findIndicator(indicators, "SNB_POLICY_RATE");

  const cards = [
    {
      title: "Rates Pressure",
      value: fedFunds ? `FED ${formatValue(fedFunds.latest, fedFunds.unit)}` : "No data",
      detail: fedFunds ? formatRecentChange(fedFunds.change) : "FEDFUNDS is not available",
      accent: "bg-[#9daf93]",
    },
    {
      title: "Inflation Pulse",
      value: inflation ? formatValue(inflation.latest, inflation.unit) : "No data",
      detail: inflation ? `US CPI YoY · ${formatRecentChange(inflation.change)}` : "US_CPI is not available",
      accent: "bg-[#c1a06f]",
    },
    {
      title: "Labor Market",
      value: unemployment ? formatValue(unemployment.latest, unemployment.unit) : "No data",
      detail: unemployment ? `US unemployment · ${formatRecentChange(unemployment.change)}` : "US_UNEMPLOYMENT is not available",
      accent: "bg-[#83a0ad]",
    },
    {
      title: "Central Bank Watch",
      value: ecb ? `ECB ${formatValue(ecb.latest, ecb.unit)}` : "No data",
      detail: snb ? `SNB ${formatValue(snb.latest, snb.unit)} · demo policy view` : "SNB policy series unavailable",
      accent: "bg-[#9f91b5]",
    },
  ];

  return (
    <section aria-label="Macro summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.title} className="desk-surface relative overflow-hidden p-5">
          <span className={`absolute inset-y-0 left-0 w-0.5 ${card.accent}`} />
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium text-[#7f8985]">{card.title}</p>
            <span className="rounded-full border border-[#4a4132] bg-[#211d16] px-2 py-0.5 text-[8px] font-semibold text-[#bca273]">Demo data</span>
          </div>
          <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[#dce1de]">{card.value}</p>
          <p className="mt-2 truncate text-[10px] text-[#68736e]">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}

function findIndicator(indicators: MacroIndicatorView[], code: string) {
  return indicators.find((indicator) => indicator.code === code);
}

function formatValue(value: number | null, unit: string | null) {
  if (value === null) return "No data";
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatRecentChange(change: number | null) {
  if (change === null) return "No previous value";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} pp recent change`;
}
