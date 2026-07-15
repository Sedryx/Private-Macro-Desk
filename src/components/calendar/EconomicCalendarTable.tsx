"use client";

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";

import { PriceReactionChart } from "@/components/calendar/PriceReactionChart";
import type { EconomicEventView, EventPriceSeries } from "@/components/calendar/types";
import { Sparkline } from "@/components/ui/Sparkline";
import { parseComparableValue } from "@/lib/calendarValue";

const ZURICH_TIME_ZONE = "Europe/Zurich";
const impacts = ["HIGH", "MEDIUM", "LOW", "HOLIDAY"] as const;
const currencies = ["USD", "EUR", "CHF", "GBP", "JPY", "CAD", "AUD", "NZD"] as const;
type ImpactFilter = (typeof impacts)[number];
type CurrencyFilter = (typeof currencies)[number];
type RangeFilter = "today" | "tomorrow" | "this-week" | "next-week" | "previous-week" | "custom";

export function EconomicCalendarTable({
  events,
  priceSeriesByCurrency,
}: {
  events: EconomicEventView[];
  priceSeriesByCurrency: Record<string, EventPriceSeries>;
}) {
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
            className="desk-button px-2.5 py-1.5 text-[10px] font-semibold"
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
                <Header>Trend</Header>
                <Header>Forecast</Header>
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
                        <td colSpan={9} className="px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#829087]">
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
                        <span className="inline-flex items-center gap-1">
                          <span className={actualTone(event.actualValue, event.forecastValue, event.title)}>
                            {event.actualValue || "—"}
                          </span>
                          {event.actualSource ? <SourceBadge source={event.actualSource} /> : null}
                        </span>
                      </Cell>
                      <Cell><Sparkline values={event.history} /></Cell>
                      <Cell>{event.forecastValue || "—"}</Cell>
                      <Cell>{event.previousValue || "—"}</Cell>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-[var(--line)] bg-[#0e1418]">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Detail label="Source" value={event.provider || event.source || "Forex Factory"} />
                            <Detail label="Previous" value={event.previousValue || "—"} />
                            <Detail label="Forecast" value={event.forecastValue || "—"} />
                            <Detail
                              label="Actual"
                              value={event.actualValue || "—"}
                              badge={event.actualSource ? <SourceBadge source={event.actualSource} /> : null}
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-t border-[var(--line)] pt-3">
                            <div>
                              <p className="text-[9px] text-[#66716c]">
                                Expected impact: {event.expectedImpact || "Not provided by Forex Factory"}
                              </p>
                              {event.history.length >= 2 ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[9px] text-[#66716c]">Last {event.history.length} releases</span>
                                  <Sparkline values={event.history} width={90} height={22} />
                                </div>
                              ) : (
                                <p className="mt-2 text-[9px] text-[#66716c]">Not enough history yet for a trend.</p>
                              )}
                            </div>
                            {event.currency && priceSeriesByCurrency[event.currency] ? (
                              <div className="w-full max-w-xs sm:w-72">
                                <PriceReactionChart
                                  pairLabel={priceSeriesByCurrency[event.currency].pairLabel}
                                  points={priceSeriesByCurrency[event.currency].points}
                                  eventTime={event.eventTime}
                                />
                              </div>
                            ) : (
                              <p className="text-[9px] text-[#66716c]">No free FX price series tracked for {event.currency || "this currency"}.</p>
                            )}
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
    ? { border: "border-[#7f1d1d]", bg: "bg-[var(--negative-soft)]", text: "text-[#f87171]", dot: "bg-[#f87171]" }
    : impact === "MEDIUM"
      ? { border: "border-[#5b4a2e]", bg: "bg-[#241e14]", text: "text-[#c3a46b]", dot: "bg-[#c3a46b]" }
      : impact === "HOLIDAY"
        ? { border: "border-[#3b4650]", bg: "bg-[#171e24]", text: "text-[#91a2ae]", dot: "bg-[#91a2ae]" }
        : { border: "border-[#353638]", bg: "bg-[#171819]", text: "text-[#8d8d8f]", dot: "bg-[#8d8d8f]" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold ${style.border} ${style.bg} ${style.text}`}>
      <span className={`h-1 w-1 rounded-full ${style.dot}`} />
      {formatLabel(impact)}
    </span>
  );
}

function Detail({ label, value, badge }: { label: string; value: string; badge?: ReactNode }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.08em] text-[#56615c]">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#b8c0bb]">
        {value}
        {badge}
      </p>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const label = source === "FRED" ? "FRED-verified" : source === "AI" ? "AI-sourced" : source;
  return (
    <span
      title={`Actual value cross-referenced from ${label}, since Forex Factory's free feed doesn't include it.`}
      className="rounded border border-[#2a332e] bg-[#141b17] px-1 py-0.5 text-[6.5px] font-semibold uppercase tracking-[0.06em] text-[#7f9184]"
    >
      {source}
    </span>
  );
}

const LOWER_IS_BETTER = ["cpi", "inflation", "unemployment", "jobless claims", "ppi", "pce price"];
const HIGHER_IS_BETTER = [
  "gdp",
  "pmi",
  "retail sales",
  "payrolls",
  "nfp",
  "ism",
  "consumer confidence",
  "consumer sentiment",
  "industrial production",
  "durable goods",
  "housing starts",
  "building permits",
];

function indicatorDirection(title: string): "higher_better" | "lower_better" | "neutral" {
  const lowered = title.toLowerCase();
  if (LOWER_IS_BETTER.some((keyword) => lowered.includes(keyword))) return "lower_better";
  if (HIGHER_IS_BETTER.some((keyword) => lowered.includes(keyword))) return "higher_better";
  return "neutral";
}

function actualTone(actual: string | null, forecast: string | null, title: string) {
  const actualNumber = parseComparableValue(actual);
  const forecastNumber = parseComparableValue(forecast);
  if (actualNumber === null || forecastNumber === null || actualNumber === forecastNumber) {
    return "font-semibold text-[#d4d4d4]";
  }

  const direction = indicatorDirection(title);
  if (direction === "neutral") return "font-semibold text-[#d4d4d4]";

  const beat = direction === "lower_better"
    ? actualNumber < forecastNumber
    : actualNumber > forecastNumber;

  return beat ? "font-semibold text-[var(--positive)]" : "font-semibold text-[var(--negative)]";
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
