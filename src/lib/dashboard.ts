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

