import type { EventImportance } from "@prisma/client";

const zurichDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

export type CalendarBriefingEvent = {
  id: string;
  title: string;
  country: string | null;
  currency: string | null;
  importance: EventImportance;
  eventTime: string;
  previousValue: string | null;
  forecastValue: string | null;
  actualValue: string | null;
  dayKey: string;
};

export type MacroSnapshotItem = {
  code: string;
  label: string;
  value: number | null;
  unit: string | null;
  date: string | null;
  delta: number | null;
  deltaUnit: "bp" | "pp" | "value";
};

export type MacroPulse = {
  ratesPressure: string;
  inflationPulse: string;
  laborPulse: string;
  usdPressure: string;
};

export type TodayFocusInput = {
  events: CalendarBriefingEvent[];
  openRiskTotal: number;
  openTradeCount: number;
  plannedTrades: number;
};

export function getZurichDateKey(date: Date) {
  return zurichDateFormatter.format(date);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getTodayTomorrowKeys(now = new Date()) {
  return {
    todayKey: getZurichDateKey(now),
    tomorrowKey: getZurichDateKey(addDays(now, 1)),
  };
}

export function sortBriefingEvents(events: CalendarBriefingEvent[]) {
  const importanceRank: Record<EventImportance, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return [...events].sort((left, right) => {
    const dayCompare = left.dayKey.localeCompare(right.dayKey);
    if (dayCompare !== 0) return dayCompare;

    const impactCompare = importanceRank[left.importance] - importanceRank[right.importance];
    if (impactCompare !== 0) return impactCompare;

    return new Date(left.eventTime).getTime() - new Date(right.eventTime).getTime();
  });
}

export function buildMacroPulse(items: MacroSnapshotItem[]): MacroPulse {
  const byCode = new Map(items.map((item) => [item.code, item]));

  const ratesAnchor = byCode.get("US10Y");
  const frontEndAnchor = byCode.get("US1Y") ?? byCode.get("US2Y");
  const inflation = byCode.get("US_CPI_YOY");
  const labor = byCode.get("US_UNEMPLOYMENT");
  const usd = byCode.get("US_DOLLAR_BROAD_INDEX");

  return {
    ratesPressure: describeRatesPressure(ratesAnchor, frontEndAnchor),
    inflationPulse: describeDelta(inflation, "Cooling", "Heating", 0.05),
    laborPulse: describeDelta(labor, "Tightening", "Softening", 0.05),
    usdPressure: describeDelta(usd, "Softer USD", "Stronger USD", 0.15),
  };
}

export function buildTodayFocus({
  events,
  openRiskTotal,
  openTradeCount,
  plannedTrades,
}: TodayFocusInput) {
  const highImpactEvents = events.filter((event) => event.importance === "HIGH");
  const focus: string[] = [];

  if (highImpactEvents.length > 0) {
    const visibleTitles = highImpactEvents.slice(0, 3).map((event) => event.title).join(", ");
    focus.push(`${highImpactEvents.length} high impact event${highImpactEvents.length > 1 ? "s" : ""}: ${visibleTitles}`);
  }

  if (openTradeCount > 0) {
    focus.push(`${openTradeCount} open trade${openTradeCount > 1 ? "s" : ""}, approx. ${formatCompactPercent(openRiskTotal)} open risk.`);
  }

  if (plannedTrades > 0) {
    focus.push(`${plannedTrades} planned trade${plannedTrades > 1 ? "s" : ""} waiting for validation.`);
  }

  if (focus.length === 0) {
    focus.push("Quiet desk: no high impact event, no open risk and no planned trade flagged.");
  }

  return focus;
}

export function formatMacroValue(item: MacroSnapshotItem) {
  if (item.value === null) return "Not connected";

  const formatted = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: item.unit === "%" ? 2 : 2,
    minimumFractionDigits: item.unit === "%" ? 2 : 0,
  }).format(item.value);

  return item.unit === "%" ? `${formatted}%` : formatted;
}

export function formatMacroDelta(item: MacroSnapshotItem) {
  if (item.delta === null) return null;

  const sign = item.delta > 0 ? "+" : "";
  if (item.deltaUnit === "bp") return `${sign}${Math.round(item.delta * 100)} bp`;
  if (item.deltaUnit === "pp") return `${sign}${item.delta.toFixed(2)} pp`;
  return `${sign}${item.delta.toFixed(2)}`;
}

function describeRatesPressure(longEnd: MacroSnapshotItem | undefined, frontEnd: MacroSnapshotItem | undefined) {
  if (!longEnd?.delta && longEnd?.delta !== 0) return "Not connected";

  const longMove = longEnd.delta;
  const frontMove = frontEnd?.delta ?? null;

  if (longMove > 0.03 || (frontMove !== null && frontMove > 0.03)) return "Rising yields";
  if (longMove < -0.03 || (frontMove !== null && frontMove < -0.03)) return "Falling yields";
  return "Stable yields";
}

function describeDelta(
  item: MacroSnapshotItem | undefined,
  lowerLabel: string,
  higherLabel: string,
  threshold: number,
) {
  if (!item?.delta && item?.delta !== 0) return "Not connected";
  if (item.delta > threshold) return higherLabel;
  if (item.delta < -threshold) return lowerLabel;
  return "Stable";
}

function formatCompactPercent(value: number) {
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}%`;
}
