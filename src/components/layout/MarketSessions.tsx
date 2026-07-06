"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const ZURICH = "Europe/Zurich";
const sessions = [
  { name: "Sydney", zone: "Australia/Sydney", open: 8, close: 17 },
  { name: "Tokyo", zone: "Asia/Tokyo", open: 9, close: 18 },
  { name: "London", zone: "Europe/London", open: 8, close: 17 },
  { name: "New York", zone: "America/New_York", open: 8, close: 17 },
] as const;

export function MarketSessions({
  now,
  onClose,
}: {
  now: Date;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const dateKey = zonedDateKey(now, ZURICH);
  const dayStart = zonedDateTimeToUtc(dateKey, 0, ZURICH);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const currentMinutes = Math.max(
    0,
    Math.min(1440, (now.getTime() - dayStart.getTime()) / 60_000),
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Market sessions"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 pb-6 pt-20 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        className="desk-surface w-full max-w-6xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="terminal-label">Session map // Zurich time</p>
            <h2 className="mt-1.5 text-[17px] font-semibold text-white">Market sessions</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#343538] px-2.5 py-1.5 text-[10px] text-[#8d8d8f] hover:bg-[#202123] hover:text-white"
          >
            Close
          </button>
        </header>

        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-lg border border-[#303134] bg-[#111214]">
            <div className="grid grid-cols-12 border-b border-[#303134] px-3 py-2">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className="text-center font-mono text-[9px] text-[#77777a]">
                  {String(index * 2).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            <div className="relative px-3 py-3">
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/80"
                style={{ left: String((currentMinutes / 1440) * 100) + "%" }}
              />
              <div className="space-y-2">
                {sessions.map((session) => {
                  const interval = bestSessionInterval(
                    session,
                    dateKey,
                    dayStart,
                    dayEnd,
                  );
                  const active = now >= interval.start && now < interval.end;
                  const start = Math.max(interval.start.getTime(), dayStart.getTime());
                  const end = Math.min(interval.end.getTime(), dayEnd.getTime());
                  const left = ((start - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100;
                  const width = Math.max(1, ((end - start) / (dayEnd.getTime() - dayStart.getTime())) * 100);
                  return (
                    <div key={session.name} className="relative h-12 border-b border-[#252628] last:border-0">
                      <div
                        className={
                          "absolute top-1/2 flex h-8 -translate-y-1/2 items-center rounded-md border px-3 " +
                          (active
                            ? "border-[#287b43] bg-[rgba(22,163,74,.18)]"
                            : "border-[#36373a] bg-[#1a1b1d]")
                        }
                        style={{ left: String(left) + "%", width: String(width) + "%" }}
                      >
                        <span className="truncate text-[11px] font-semibold text-[#eeeeee]">
                          {session.name}
                        </span>
                        <span className="ml-2 truncate font-mono text-[9px] text-[#77777a]">
                          {formatLocalTime(now, session.zone)} local
                        </span>
                        {active ? (
                          <span className="ml-auto size-1.5 shrink-0 rounded-full bg-[var(--positive)]" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[9px] text-[#626264]">
            Indicative cash-session hours. Daylight-saving changes are handled from each market timezone.
          </p>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function activeSessionName(now: Date) {
  const active = sessions.filter((session) => {
    const localHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone: session.zone,
      }).format(now),
    );
    return localHour >= session.open && localHour < session.close;
  });
  return active.at(-1)?.name ?? "Closed";
}

function bestSessionInterval(
  session: (typeof sessions)[number],
  dateKey: string,
  dayStart: Date,
  dayEnd: Date,
) {
  const candidates = [-1, 0, 1].map((offset) => {
    const localDate = addDateKeyDays(dateKey, offset);
    return {
      start: zonedDateTimeToUtc(localDate, session.open, session.zone),
      end: zonedDateTimeToUtc(localDate, session.close, session.zone),
    };
  });
  return candidates.sort(
    (left, right) =>
      overlap(right.start, right.end, dayStart, dayEnd) -
      overlap(left.start, left.end, dayStart, dayEnd),
  )[0];
}

function overlap(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  return Math.max(
    0,
    Math.min(end.getTime(), rangeEnd.getTime()) -
      Math.max(start.getTime(), rangeStart.getTime()),
  );
}

function zonedDateTimeToUtc(dateKey: string, hour: number, timeZone: string) {
  const parts = dateKey.split("-").map(Number);
  const wallTime = Date.UTC(parts[0], parts[1] - 1, parts[2], hour);
  const initial = new Date(wallTime);
  const represented = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(initial);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(represented.find((part) => part.type === type)?.value);
  const representedWall = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
  );
  return new Date(wallTime - (representedWall - wallTime));
}

function zonedDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
}

function addDateKeyDays(dateKey: string, days: number) {
  const date = new Date(dateKey + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatLocalTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
