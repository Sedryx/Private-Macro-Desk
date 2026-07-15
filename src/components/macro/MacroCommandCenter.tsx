"use client";

import { useState } from "react";

import { CountryMacroProfileView } from "@/components/macro/CountryMacroProfile";
import { CountrySelector } from "@/components/macro/CountrySelector";
import { GlobalMacroOverview } from "@/components/macro/GlobalMacroOverview";
import type { DailyMacroBriefView } from "@/lib/ai/dailyBrief";
import type { CurrencyVolatilitySeries } from "@/lib/data/currencyVolatility.server";
import type { CountryMacroProfile } from "@/lib/macroProfiles";

export function MacroCommandCenter({
  profiles,
  dailyBrief,
  currencySeries,
}: {
  profiles: CountryMacroProfile[];
  dailyBrief: DailyMacroBriefView | null;
  currencySeries: CurrencyVolatilitySeries[];
}) {
  const [activeId, setActiveId] = useState("united-states");
  const activeProfile = profiles.find((profile) => profile.id === activeId);
  return (
    <div className="space-y-3">
      <header className="desk-surface flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="terminal-label">Macro data</p>
          <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#f2f2f2]">
            Macro
          </h1>
        </div>
        <CountrySelector
          profiles={profiles}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </header>

      {activeId === "global" ? (
        <GlobalMacroOverview profiles={profiles} dailyBrief={dailyBrief} currencySeries={currencySeries} />
      ) : activeProfile ? (
        <CountryMacroProfileView
          key={activeProfile.id}
          profile={activeProfile}
          profiles={profiles}
        />
      ) : null}
    </div>
  );
}
