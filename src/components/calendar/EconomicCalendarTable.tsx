"use client";

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";

import type { EconomicEventView } from "@/components/calendar/types";

const ZURICH_TIME_ZONE = "Europe/Zurich";
const impacts = ["HIGH", "MEDIUM", "LOW", "HOLIDAY"] as const;
const currencies = ["USD", "EUR", "CHF", "GBP", "JPY", "CAD", "AUD", "NZD"] as const;
type ImpactFilter = (typeof impacts)[number];
type CurrencyFilter = (typeof currencies)[number];
type RangeFilter = "today" | "tomorrow" | "this-week" | "next-week" | "previous-week" | "custom";

export function EconomicCalendarTable({ events }: { events: EconomicEventView[] }) {
  const [range, setRange] = useState<RangeFilter>("this-week");
  const [selectedImpacts, setSelectedImpacts] = useState<Set<ImpactFilter>>(
    () => new Set(impacts),
  );
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<CurrencyFilter>>(
    () => new Set(currencies),
  );
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const tableRef = useRef<HTMLElement>(null);

  const filteredEvents = useMemo(() => {
    const bounds = getRangeBounds(range, customStart, customEnd);
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const dateKey = zurichDateKey(new Date(event.eventTime));
      const currency = event.currency as CurrencyFilter | null;
      return dateKey >= bounds.start &&
        dateKey <= bounds.end &&
        selectedImpacts.has(event.impact) &&
        currency !== null &&
        selectedCurrencies.has(currency) &&
        (!query || event.title.toLowerCase().includes(query));
    });
  }, [customEnd, customStart, events, range, search, selectedCurrencies, selectedImpacts]);

  return (
    <section ref={tableRef} className="desk-surface overflow-hidden bg-[#141516] shadow-[inset_0_1px_0_rgba(255,255,255,.02)] fullscreen:overflow-auto fullscreen:rounded-none fullscreen:p-3">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
        <p className="terminal-label">Calendar data // Forex Factory weekly</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as RangeFilter)}
            className="desk-field w-auto px-2.5 py-1.5 text-[10px]"
            aria-label="Calendar date range"
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This week</option>
            <option value="next-week">Next week</option>
            <option value="previous-week">Previous week</option>
            <option value="custom">Custom range</option>
          </select>
          {range === "custom" ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="desk-field w-auto px-2 py-1.5 text-[10px]"
                aria-label="Custom range start"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="desk-field w-auto px-2 py-1.5 text-[10px]"
                aria-label="Custom range end"
              />
            </div>
          ) : null}
          <MultiFilter
            label="Impact"
            options={impacts}
            selected={selectedImpacts}
            onToggle={(value) => toggleSetValue(selectedImpacts, value, setSelectedImpacts)}
          />
          <MultiFilter
            label="CCY"
            options={currencies}
            selected={selectedCurrencies}
            onToggle={(value) => toggleSetValue(selectedCurrencies, value, setSelectedCurrencies)}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search event"
            className="desk-field w-40 px-2.5 py-1.5 text-[10px]"
          />
          <button
            type="button"
            onClick={() => tableRef.current?.requestFullscreen()}
            className="rounded-md border border-[#37383b] bg-[#111214] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#89898b] hover:border-[#55565a] hover:text-white"
          >
            Fullscreen
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="px-5 py-16 text-center text-[11px] text-[#6f7a75]">
          No events match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="bg-[#0d0e0f]">
              <tr className="border-b border-[var(--line)] text-[8px] uppercase tracking-[0.1em] text-[#59655f]">
                <Header>Date</Header>
                <Header>Time</Header>
                <Header>CCY</Header>
                <Header className="w-full">Event</Header>
                <Header>Impact</Header>
                <Header>Actual</Header>
                <Header>High</Header>
                <Header>Forecast</Header>
                <Header>Low</Header>
                <Header>Previous</Header>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => {
                const previous = filteredEvents[index - 1];
                const dayKey = zurichDateKey(new Date(event.eventTime));
                const showDay = !previous || zurichDateKey(new Date(previous.eventTime)) !== dayKey;
                const expanded = expandedId === event.id;
                return (
                  <Fragment key={event.id}>
                    {showDay ? (
                      <tr className="border-b border-[var(--line)] bg-[#111214]">
                        <td colSpan={10} className="px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#829087]">
                          {formatGroupDate(event.eventTime)}
                        </td>
                      </tr>
                    ) : null}
                    <tr
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={() => setExpandedId(expanded ? null : event.id)}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                          keyboardEvent.preventDefault();
                          setExpandedId(expanded ? null : event.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-[var(--line)] text-[11px] transition hover:bg-white/[0.025] ${
                        event.impact === "HIGH" ? "bg-[rgba(220,38,38,.07)]" : "bg-[#141516]"
                      }`}
                    >
                      <Cell muted>{formatShortDate(event.eventTime)}</Cell>
                      <Cell strong>{formatTime(event.eventTime)}</Cell>
                      <Cell strong>{event.currency || "—"}</Cell>
                      <Cell>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[12px] font-medium text-[#dce2de]">{event.title}</span>
                          <span className="rounded border border-[#334039] bg-[#151d19] px-1 py-0.5 text-[7px] font-semibold text-[#8fa091]">FF</span>
                        </div>
                      </Cell>
                      <Cell><ImpactBadge impact={event.impact} /></Cell>
                      <Cell>
                        <span className={actualTone(event.actualValue, event.forecastValue)}>
                          {event.actualValue || "—"}
                        </span>
                      </Cell>
                      <Cell muted>—</Cell>
                      <Cell>{event.forecastValue || "—"}</Cell>
                      <Cell muted>—</Cell>
                      <Cell>{event.previousValue || "—"}</Cell>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-[var(--line)] bg-[#0e1418]">
                        <td colSpan={10} className="px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Detail label="Source" value={event.provider || event.source || "Forex Factory"} />
                            <Detail label="Previous" value={event.previousValue || "—"} />
                            <Detail label="Forecast" value={event.forecastValue || "—"} />
                            <Detail label="Actual" value={event.actualValue || "—"} />
                          </div>
                          <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-3 md:grid-cols-2">
                            <p className="text-[9px] text-[#66716c]">
                              Expected impact: {event.expectedImpact || "Not provided by Forex Factory"}
                            </p>
                            <p className="text-[9px] text-[#66716c] md:text-right">
                              Historical chart coming later
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MultiFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: Set<T>;
  onToggle: (value: T) => void;
}) {
  return (
    <details className="relative">
      <summary className="desk-field cursor-pointer list-none px-2.5 py-1.5 text-[10px]">
        {label} · {selected.size}
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-lg border border-[var(--line)] bg-[#11171b] p-2 shadow-2xl">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[9px] text-[#a5aea9] hover:bg-white/[0.03]">
            <input
              type="checkbox"
              checked={selected.has(option)}
              onChange={() => onToggle(option)}
              className="accent-[#8fa083]"
            />
            {formatLabel(option)}
          </label>
        ))}
      </div>
    </details>
  );
}

function toggleSetValue<T>(current: Set<T>, value: T, setValue: (value: Set<T>) => void) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setValue(next);
}

function Header({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-3 py-2 font-semibold ${className}`}>{children}</th>;
}

function Cell({ children, muted = false, strong = false }: { children: ReactNode; muted?: boolean; strong?: boolean }) {
  return (
    <td className={`whitespace-nowrap px-3 py-2 ${strong ? "font-semibold text-[#d7ddd9]" : muted ? "text-[#5f6a65]" : "text-[#9ba59f]"}`}>
      {children}
    </td>
  );
}

function ImpactBadge({ impact }: { impact: EconomicEventView["impact"] }) {
  const style = impact === "HIGH"
    ? "border-[#7f1d1d] bg-[var(--negative-soft)] text-[#f87171]"
    : impact === "MEDIUM"
      ? "border-[#5b4a2e] bg-[#241e14] text-[#c3a46b]"
      : impact === "HOLIDAY"
        ? "border-[#3b4650] bg-[#171e24] text-[#91a2ae]"
        : "border-[#353638] bg-[#171819] text-[#8d8d8f]";
  return <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-semibold ${style}`}>{formatLabel(impact)}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[8px] uppercase tracking-[0.08em] text-[#56615c]">{label}</p><p className="mt-1 text-[10px] text-[#b8c0bb]">{value}</p></div>;
}

function actualTone(actual: string | null, forecast: string | null) {
  const actualNumber = parseComparableValue(actual);
  const forecastNumber = parseComparableValue(forecast);
  if (actualNumber === null || forecastNumber === null || actualNumber === forecastNumber) {
    return "font-semibold text-[#d4d4d4]";
  }
  return actualNumber > forecastNumber
    ? "font-semibold text-[var(--positive)]"
    : "font-semibold text-[var(--negative)]";
}

function parseComparableValue(value: string | null) {
  if (!value) return null;
  const match = value.replaceAll(",", "").match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return null;
  const suffix = value.toUpperCase();
  if (suffix.includes("T")) return parsed * 1_000_000_000_000;
  if (suffix.includes("B")) return parsed * 1_000_000_000;
  if (suffix.includes("M")) return parsed * 1_000_000;
  if (suffix.includes("K")) return parsed * 1_000;
  return parsed;
}

function getRangeBounds(range: RangeFilter, customStart: string, customEnd: string) {
  const today = dateKeyToUtc(zurichDateKey(new Date()));
  const day = today.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = addDays(today, mondayOffset);
  if (range === "today") return bounds(today, today);
  if (range === "tomorrow") { const tomorrow = addDays(today, 1); return bounds(tomorrow, tomorrow); }
  if (range === "next-week") return bounds(addDays(thisMonday, 7), addDays(thisMonday, 13));
  if (range === "previous-week") return bounds(addDays(thisMonday, -7), addDays(thisMonday, -1));
  if (range === "custom" && customStart && customEnd) {
    return {
      start: customStart <= customEnd ? customStart : customEnd,
      end: customStart <= customEnd ? customEnd : customStart,
    };
  }
  if (range === "custom") return bounds(today, today);
  return bounds(thisMonday, addDays(thisMonday, 6));
}

function bounds(start: Date, end: Date) { return { start: utcDateKey(start), end: utcDateKey(end) }; }
function addDays(date: Date, days: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
function dateKeyToUtc(key: string) { return new Date(`${key}T00:00:00.000Z`); }
function utcDateKey(date: Date) { return date.toISOString().slice(0, 10); }
function zurichDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: ZURICH_TIME_ZONE }).format(date);
}
function formatGroupDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: ZURICH_TIME_ZONE }).format(new Date(value));
}
function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: ZURICH_TIME_ZONE }).format(new Date(value));
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZURICH_TIME_ZONE }).format(new Date(value));
}
function formatLabel(value: string) { return value.charAt(0) + value.slice(1).toLowerCase(); }
