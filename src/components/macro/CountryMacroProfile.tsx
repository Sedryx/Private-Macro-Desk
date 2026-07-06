"use client";

import { useState } from "react";

import { MacroIndicatorChart } from "@/components/macro/MacroIndicatorChart";
import {
  macroSectionOrder,
  type CountryMacroProfile,
  type MacroSectionKey,
  type MacroSource,
} from "@/lib/macroProfiles";

export function CountryMacroProfileView({ profile }: { profile: CountryMacroProfile }) {
  const [activeSection, setActiveSection] = useState<MacroSectionKey>("centralBank");
  const [activeMetricId, setActiveMetricId] = useState(
    profile.sections.centralBank.indicators[0]?.id ?? "",
  );

  const section = profile.sections[activeSection];
  const activeMetric =
    section.indicators.find((indicator) => indicator.id === activeMetricId) ??
    section.indicators[0];
  function selectSection(key: MacroSectionKey) {
    setActiveSection(key);
    setActiveMetricId(profile.sections[key].indicators[0]?.id ?? "");
  }

  return (
    <div className="space-y-5">
      <section className="desk-surface overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#edf0ed]">
              {profile.country}
            </h2>
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
              {item.stale ? <StaleBadge /> : null}
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
                          : activeMetric.source === "Data unavailable"
                            ? "Source unavailable"
                          : "No recent change")}
                  </p>
                  <p className="mt-1 text-[8px] text-[#65706b]">
                    {activeMetric.source}
                    {activeMetric.latestDate ? ` · observation ${activeMetric.latestDate}` : ""}
                  </p>
                  {activeMetric.sourceUpdatedDate ? (
                    <p className="mt-1 text-[8px] text-[#59645f]">
                      Source updated · {activeMetric.sourceUpdatedDate}
                    </p>
                  ) : null}
                  {activeMetric.stale ? <StaleBadge /> : null}
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
                  ? "Not connected yet — run the macro sync."
                  : activeMetric?.source === "Coming soon"
                    ? "Coming soon — official data source not connected."
                    : activeMetric?.source === "Data unavailable"
                      ? "Data unavailable from the configured official source and fallback."
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
                            : indicator.source === "Data unavailable"
                              ? "Source unavailable"
                            : indicator.source === "Not connected"
                              ? "Awaiting sync"
                              : "No recent change")}
                      </span>
                      <SourceBadge source={indicator.source} />
                      {indicator.stale ? <StaleBadge /> : null}
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
                  {indicator.sourceUpdatedDate ? (
                    <p className="mt-1 text-[8px] text-[#59645f]">
                      Source updated · {indicator.sourceUpdatedDate}
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
}: {
  source: MacroSource | "FRED / partial";
}) {
  const styles =
    source === "Live data" || source === "FRED" || source === "ECB" ||
      source === "Eurostat" || source === "Eurostat flash"
      ? "border-[#385044] bg-[#15231b] text-[#9fc0a5]"
      : source === "FRED / calculated"
        ? "border-[#3d4e57] bg-[#152027] text-[#9eb9c5]"
        : source === "FRED fallback"
          ? "border-[#5a4930] bg-[#251f16] text-[#c5a66f]"
        : source === "Not connected" ||
            source === "Data unavailable" ||
            source === "Coming soon" ||
            source === "FRED / partial"
          ? "border-[#394147] bg-[#171d21] text-[#8d9993]"
          : "border-[#433d32] bg-[#1d1a15] text-[#9e8b69]";

  return (
    <span
      className={`inline-block rounded-full border px-1.5 py-0.5 text-[7px] font-semibold ${styles}`}
    >
      {source}
    </span>
  );
}

function StaleBadge() {
  return (
    <span className="mt-1 inline-block rounded-full border border-[#5a4930] bg-[#251f16] px-1.5 py-0.5 text-[7px] font-semibold text-[#c5a66f]">
      Stale
    </span>
  );
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
