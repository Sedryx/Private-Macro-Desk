import type { MacroCategory } from "@prisma/client";

import { MacroIndicatorChart, type MacroChartPoint } from "@/components/macro/MacroIndicatorChart";

export type MacroIndicatorView = {
  id: string;
  code: string;
  name: string;
  country: string | null;
  category: MacroCategory;
  unit: string | null;
  source: string | null;
  latest: number | null;
  change: number | null;
  minimum: number | null;
  maximum: number | null;
  pointCount: number;
  values: MacroChartPoint[];
};

const categoryStyles: Partial<Record<MacroCategory, { badge: string; line: string }>> = {
  RATES: { badge: "border-[#435044] bg-[#19221a] text-[#aabd9f]", line: "#9daf93" },
  INFLATION: { badge: "border-[#51443a] bg-[#241d18] text-[#c2a37f]", line: "#c1a06f" },
  LABOR: { badge: "border-[#3d4b51] bg-[#172126] text-[#9eb1ba]", line: "#83a0ad" },
  CENTRAL_BANK: { badge: "border-[#484159] bg-[#1f1b27] text-[#aea1bf]", line: "#9f91b5" },
};

export function MacroIndicatorCard({ indicator }: { indicator: MacroIndicatorView }) {
  const style = categoryStyles[indicator.category] ?? {
    badge: "border-[#3c4448] bg-[#171d20] text-[#9ba49f]",
    line: "#8e9a94",
  };

  return (
    <article className="desk-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold tracking-[0.08em] ${style.badge}`}>
              {formatLabel(indicator.category)}
            </span>
            <span className="rounded-full border border-[#4a4132] bg-[#211d16] px-2.5 py-1 text-[8px] font-semibold text-[#bca273]">Demo data</span>
          </div>
          <h2 className="mt-3 text-[15px] font-semibold tracking-[-0.015em] text-[#e4e8e5]">{indicator.name}</h2>
          <p className="mt-1 text-[10px] text-[#65706b]">{indicator.code}{indicator.country ? ` · ${indicator.country}` : ""}</p>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] text-[#65706b]">Latest demo value</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#e3e7e4]">{formatValue(indicator.latest, indicator.unit)}</p>
          <p className={`mt-1 text-[10px] ${getChangeTone(indicator.change)}`}>{formatChange(indicator.change, indicator.unit)}</p>
        </div>
      </div>

      {indicator.values.length === 0 ? (
        <div className="px-6 py-16 text-center text-[12px] text-[#68736e]">No values yet</div>
      ) : (
        <div className="px-3 pt-4 sm:px-5">
          <MacroIndicatorChart points={indicator.values} unit={indicator.unit} color={style.line} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-px border-t border-[var(--line)] bg-[var(--line)]">
        <Metric label="Minimum" value={formatValue(indicator.minimum, indicator.unit)} />
        <Metric label="Maximum" value={formatValue(indicator.maximum, indicator.unit)} />
        <Metric label="Points" value={String(indicator.pointCount)} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-3 text-center">
      <p className="text-[8px] uppercase tracking-[0.08em] text-[#59645f]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#aeb6b2]">{value}</p>
    </div>
  );
}

function formatValue(value: number | null, unit: string | null) {
  if (value === null) return "No data";
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatChange(change: number | null, unit: string | null) {
  if (change === null) return "No previous value";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}${unit === "%" ? " pp" : unit ? ` ${unit}` : ""} vs previous`;
}

function getChangeTone(change: number | null) {
  if (change === null || change === 0) return "text-[#78827e]";
  return change > 0 ? "text-[#c1a079]" : "text-[#9caf91]";
}

function formatLabel(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}
