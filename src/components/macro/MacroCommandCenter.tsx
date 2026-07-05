"use client";

import { useState } from "react";

import { CountryMacroProfileView } from "@/components/macro/CountryMacroProfile";
import { CountrySelector } from "@/components/macro/CountrySelector";
import { GlobalMacroOverview } from "@/components/macro/GlobalMacroOverview";
import type { CountryMacroProfile } from "@/lib/macroProfiles";

export function MacroCommandCenter({
  profiles,
}: {
  profiles: CountryMacroProfile[];
}) {
  const [activeId, setActiveId] = useState("united-states");
  const activeProfile = profiles.find((profile) => profile.id === activeId);
  const hasFredData = profiles.some((profile) =>
    Object.values(profile.sections).some((section) =>
      section.indicators.some((indicator) => indicator.source.startsWith("FRED")),
    ),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f9d88]">
              Macro command center
            </p>
            <span className="rounded-full border border-[#4a4132] bg-[#211d16] px-2 py-0.5 text-[8px] font-semibold text-[#bca273]">
              {hasFredData
                ? "USA + Euro Area live · Others coming soon"
                : "Not connected"}
            </span>
          </div>
          <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.04em] text-[#f0f2ef] sm:text-[34px]">
            Country macro profiles
          </h1>
          <p className="mt-2 text-[12px] leading-5 text-[#87918c] sm:text-[13px]">
            Compare policy regimes globally, then drill into the inflation, labour,
            activity and market signals that shape each currency zone.
          </p>
        </div>
        <p className="max-w-sm text-[9px] leading-4 text-[#606b66] lg:text-right">
          USA and Euro Area use server-side FRED data. Other regions remain clean
          placeholders until official sources are connected.
        </p>
      </header>

      <CountrySelector
        profiles={profiles}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {activeId === "global" ? (
        <GlobalMacroOverview profiles={profiles} />
      ) : activeProfile ? (
        <CountryMacroProfileView key={activeProfile.id} profile={activeProfile} />
      ) : null}
    </div>
  );
}
