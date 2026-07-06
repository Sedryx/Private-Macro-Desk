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
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[27px] font-semibold tracking-[-0.04em] text-[#f0f2ef] sm:text-[34px]">
          Macro
        </h1>
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
