"use client";

import { useEffect, useState } from "react";

import { logout } from "@/app/login/actions";
import { activeSessionName, MarketSessions } from "@/components/layout/MarketSessions";
import type { SessionUser } from "@/lib/auth/session";

const clocks = [
  { label: "ZRH", zone: "Europe/Zurich" },
  { label: "LON", zone: "Europe/London" },
  { label: "NYC", zone: "America/New_York" },
  { label: "TYO", zone: "Asia/Tokyo" },
] as const;

const feedItems = {
  en: [
    "MACRO DATA // FRED - EUROSTAT - ECB",
    "CALENDAR // FOREX FACTORY WEEKLY",
    "DESK // PRIVATE WORKSPACE",
    "EXECUTION // DISABLED",
  ],
  fr: [
    "DONNEES MACRO // FRED - EUROSTAT - ECB",
    "CALENDRIER // FOREX FACTORY HEBDO",
    "DESK // WORKSPACE PRIVE",
    "EXECUTION // DESACTIVEE",
  ],
} as const;

export function TerminalHeader({ language = "en", user }: { language?: string; user?: SessionUser | null }) {
  const [now, setNow] = useState<Date | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const isFr = language === "fr";
  const items = isFr ? feedItems.fr : feedItems.en;

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-11 min-w-0 items-center border-b border-[#262729] bg-[rgba(9,10,11,0.94)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => setSessionsOpen(true)}
        className="flex h-full shrink-0 items-center gap-3 border-r border-[#262729] px-4 hover:bg-white/[0.025] lg:px-5"
      >
        <span className="size-1.5 rounded-full bg-[var(--positive)] shadow-[0_0_8px_rgba(22,163,74,.55)]" />
        <span className="terminal-label text-[#9a9a9a]">
          Session // {now ? activeSessionName(now, language) : "--"}
        </span>
      </button>

      <div className="hidden shrink-0 items-center gap-4 border-r border-[#262729] px-4 xl:flex">
        {clocks.map((clock) => (
          <div key={clock.label} className="flex items-baseline gap-1.5 text-[9px]">
            <span className="text-[#5f5f5f]">{clock.label}</span>
            <time className="font-mono text-[10px] font-medium tabular-nums text-[#c8c8c8]">
              {now ? formatClock(now, clock.zone) : "--:--"}
            </time>
          </div>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden" aria-label={isFr ? "Statut des donnees du desk" : "Desk data status"}>
        <div className="terminal-ticker-track">
          {[...items, ...items].map((item, index) => (
            <span key={item + index} className="px-6 text-[9px] uppercase tracking-[0.1em] text-[#676767]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {user ? (
        <form action={logout} className="flex h-full shrink-0 items-center gap-2 border-l border-[#262729] px-4">
          <span className="terminal-label text-[#9a9a9a]">{user.name}</span>
          <button type="submit" className="rounded-md border border-[#30393e] bg-[#11181c] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white">
            {isFr ? "Deconnexion" : "Logout"}
          </button>
        </form>
      ) : null}

      {sessionsOpen && now ? (
        <MarketSessions now={now} language={language} onClose={() => setSessionsOpen(false)} />
      ) : null}
    </header>
  );
}

function formatClock(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
