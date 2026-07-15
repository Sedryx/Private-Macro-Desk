"use client";

import { useEffect, useState } from "react";

const CITIES = [
  { city: "Zurich", tz: "Europe/Zurich" },
  { city: "Paris", tz: "Europe/Paris" },
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
] as const;

const formatters = CITIES.map(
  ({ tz }) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    }),
);

const hourFormatters = CITIES.map(
  ({ tz }) => new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }),
);

export function WorldClockStrip() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="desk-surface flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
      {CITIES.map((entry, index) => {
        const localHour = now ? Number(hourFormatters[index].format(now)) : null;
        const open = localHour !== null && localHour >= 7 && localHour < 22;
        return (
          <div key={entry.city} className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-[var(--positive)]" : "bg-[#454b48]"}`} />
            <span className="text-[9px] uppercase tracking-[0.08em] text-[#68736e]">{entry.city}</span>
            <span className="font-mono text-[11px] font-medium text-[#d7ddd9]">
              {now ? formatters[index].format(now) : "--:--"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
