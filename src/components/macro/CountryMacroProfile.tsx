"use client";

import { useState } from "react";

import { MacroIndicatorChart } from "@/components/macro/MacroIndicatorChart";
import {
  macroSectionOrder,
  type CountryMacroProfile,
  type MacroSectionKey,
  type MacroSource,
} from "@/lib/macroProfiles";

const stanceStyles = {
  tight: "border-[#574a3d] bg-[#241d18] text-[#c4a77f]",
  neutral: "border-[#3c484d] bg-[#172126] text-[#9fb0b7]",
  easing: "border-[#3e4d40] bg-[#18221a] text-[#a8bc9f]",
};

export function CountryMacroProfileView({ profile }: { profile: CountryMacroProfile }) {
  const [activeSection, setActiveSection] = useState<MacroSectionKey>("centralBank");
  const [activeMetricId, setActiveMetricId] = useState(
    profile.sections.centralBank.indicators[0]?.id ?? "",
  );

  const section = profile.sections[activeSection];
  const activeMetric =
    section.indicators.find((indicator) => indicator.id === activeMetricId) ??
    section.indicators[0];
  const profileSources = Object.values(profile.sections).flatMap((macroSection) =>
    macroSection.indicators.map((indicator) => indicator.source),
  );
  const sourceLabel = getProfileSourceLabel(profile.countryCode, profileSources);

  function selectSection(key: MacroSectionKey) {
    setActiveSection(key);
    setActiveMetricId(profile.sections[key].indicators[0]?.id ?? "");
  }

  return (
    <div className="space-y-5">
      <section className="desk-surface overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#354039] bg-[#172019] px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-[#a9bba1]">
                {profile.countryCode}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${stanceStyles[profile.stanceTone]}`}>
                {profile.stance}
              </span>
              <SourceBadge source={sourceLabel} large />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-[#edf0ed]">
              {profile.country}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#8b9690]">
              {profile.summary}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-[var(--line)] pt-4 sm:grid-cols-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <HeaderMetric label="Central bank" value={profile.centralBank} />
            <HeaderMetric label="Currency" value={profile.currency} />
            <HeaderMetric label="Policy rate" value={profile.policyRate} />
            <HeaderMetric label="Next meeting" value={profile.nextMeeting} />
          </dl>
        </div>
      </section>

      <section
        aria-label={`${profile.country} snapshot`}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {profile.snapshot.map((item) => (
          <article key={item.label} className="desk-surface p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] text-[#68736e]">{item.label}</p>
              <SourceBadge source={item.source ?? "Demo"} />
            </div>
            <p className="mt-2 text-[16px] font-semibold tracking-[-0.025em] text-[#dde2de]">
              {item.value}
            </p>
            <p className="mt-1 text-[9px] text-[#89968e]">
              {item.change ?? (item.source === "Not connected" ? "Awaiting sync" : "")}
            </p>
          </article>
        ))}
      </section>

      <section className="desk-surface overflow-hidden">
        <div className="overflow-x-auto border-b border-[var(--line)] bg-[#10161b] px-2">
          <div className="flex min-w-max">
            {macroSectionOrder.map((key) => {
              const active = key === activeSection;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectSection(key)}
                  className={`relative px-4 py-3 text-[10px] font-medium transition-colors ${
                    active
                      ? "text-[#dfe5e0]"
                      : "text-[#6f7a75] hover:text-[#adb6b1]"
                  }`}
                >
                  {profile.sections[key].shortTitle}
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-px bg-[#a7b89e]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <div className="min-w-0 border-b border-[var(--line)] p-4 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#748079]">
                  {section.title}
                </p>
                <h3 className="mt-2 text-[15px] font-semibold text-[#e3e8e4]">
                  {activeMetric?.label ?? "No indicator"}
                </h3>
                <p className="mt-1 text-[10px] text-[#6e7974]">{section.description}</p>
              </div>
              {activeMetric ? (
                <div className="sm:text-right">
                  <p className="text-xl font-semibold text-[#e1e6e2]">
                    {activeMetric.value}
                  </p>
                  <p className="mt-1 text-[9px] text-[#91a08f]">
                    {activeMetric.change ??
                      (activeMetric.source === "Not connected"
                        ? "Awaiting sync"
                        : activeMetric.source === "Coming soon"
                          ? "Awaiting integration"
                          : "No recent change")}
                  </p>
                  <p className="mt-1 text-[8px] text-[#65706b]">
                    {activeMetric.source}
                    {activeMetric.latestDate ? ` · ${activeMetric.latestDate}` : ""}
                  </p>
                </div>
              ) : null}
            </div>
            {activeMetric && activeMetric.history.length > 0 ? (
              <div className="mt-4">
                <MacroIndicatorChart points={activeMetric.history} />
              </div>
            ) : (
              <p className="py-16 text-center text-[11px] text-[#68736e]">
                {activeMetric?.source === "Not connected"
                  ? "Not connected yet — run the FRED sync."
                  : activeMetric?.source === "Coming soon"
                    ? "Coming soon — official data source not connected."
                    : "No values yet"}
              </p>
            )}
          </div>

          <div className="grid content-start gap-2 bg-[#10161a] p-3 sm:grid-cols-2 xl:grid-cols-1">
            {section.indicators.map((indicator) => {
              const active = indicator.id === activeMetric?.id;
              return (
                <button
                  key={indicator.id}
                  type="button"
                  onClick={() => setActiveMetricId(indicator.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-[#536052] bg-[#1a221c]"
                      : "border-[#283138] bg-[#12191e] hover:border-[#3a454b]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] text-[#69756f]">{indicator.label}</p>
                      <p className="mt-1.5 text-[14px] font-semibold text-[#dce2de]">
                        {indicator.value}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`block text-[9px] ${active ? "text-[#aaba9f]" : "text-[#78847d]"}`}>
                        {indicator.change ??
                          (indicator.source === "Coming soon"
                            ? "Awaiting integration"
                            : indicator.source === "Not connected"
                              ? "Awaiting sync"
                              : "No recent change")}
                      </span>
                      <SourceBadge source={indicator.source} />
                    </div>
                  </div>
                  {indicator.context ? (
                    <p className="mt-2 text-[8px] leading-4 text-[#5e6964]">
                      {indicator.context}
                    </p>
                  ) : null}
                  {indicator.latestDate ? (
                    <p className="mt-2 text-[8px] text-[#65706b]">
                      Latest observation · {indicator.latestDate}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SourceBadge({
  source,
  large = false,
}: {
  source: MacroSource | "FRED / partial";
  large?: boolean;
}) {
  const styles =
    source === "Live data" || source === "FRED"
      ? "border-[#385044] bg-[#15231b] text-[#9fc0a5]"
      : source === "FRED / calculated"
        ? "border-[#3d4e57] bg-[#152027] text-[#9eb9c5]"
        : source === "Not connected" ||
            source === "Coming soon" ||
            source === "FRED / partial"
          ? "border-[#394147] bg-[#171d21] text-[#8d9993]"
          : "border-[#433d32] bg-[#1d1a15] text-[#9e8b69]";

  return (
    <span
      className={`inline-block rounded-full border font-semibold ${styles} ${
        large ? "px-2.5 py-1 text-[8px]" : "px-1.5 py-0.5 text-[7px]"
      }`}
    >
      {source}
    </span>
  );
}

function getProfileSourceLabel(
  countryCode: string,
  sources: MacroSource[],
): MacroSource | "FRED / partial" {
  if (countryCode !== "US") return "Coming soon";

  const hasFred = sources.some((source) => source.startsWith("FRED"));
  if (!hasFred) return "Not connected";
  if (sources.some((source) => source === "Not connected")) return "FRED / partial";
  return "Live data";
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] uppercase tracking-[0.09em] text-[#5f6b65]">{label}</dt>
      <dd className="mt-1 max-w-[160px] text-[10px] font-medium leading-4 text-[#bbc3be]">
        {value}
      </dd>
    </div>
  );
}
