"use client";

import { useMemo, useState } from "react";

import { MacroIndicatorChart } from "@/components/macro/MacroIndicatorChart";
import {
  isLiveMacroSource,
  macroSectionOrder,
  type CountryMacroProfile,
  type MacroSectionKey,
  type MacroSource,
  type MacroTrendPoint,
} from "@/lib/macroProfiles";

type ChartMode = "bars" | "line";
type Timeframe = "1Y" | "3Y" | "5Y" | "ALL";

export function CountryMacroProfileView({
  profile,
  profiles,
}: {
  profile: CountryMacroProfile;
  profiles: CountryMacroProfile[];
}) {
  const initialMetric = firstConnectedMetric(profile) ?? profile.sections.centralBank.indicators[0];
  const [activeSection, setActiveSection] = useState<MacroSectionKey>("centralBank");
  const [activeMetricId, setActiveMetricId] = useState(initialMetric?.id ?? "");
  const [search, setSearch] = useState("");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [timeframe, setTimeframe] = useState<Timeframe>("5Y");
  const [comparisonProfileId, setComparisonProfileId] = useState("");
  const [comparisonMetricId, setComparisonMetricId] = useState("");

  const allIndicators = useMemo(
    () =>
      macroSectionOrder.flatMap((sectionKey) =>
        profile.sections[sectionKey].indicators.filter(isSelectableMetric).map((metric) => ({
          metric,
          sectionKey,
        })),
      ),
    [profile],
  );

  const activeEntry =
    allIndicators.find(({ metric }) => metric.id === activeMetricId) ??
    allIndicators[0];
  const activeMetric = activeEntry?.metric;
  const comparisonProfile = profiles.find(
    (item) => item.id === comparisonProfileId,
  );
  const comparisonEntries = comparisonProfile
    ? macroSectionOrder.flatMap((sectionKey) =>
        comparisonProfile.sections[sectionKey].indicators.map((metric) => ({
          metric,
          sectionKey,
        })),
      )
    : [];
  const comparisonMetric = comparisonEntries.find(
    ({ metric }) => metric.id === comparisonMetricId,
  )?.metric;
  const query = search.trim().toLowerCase();
  const visibleIndicators = allIndicators.filter(({ metric, sectionKey }) => {
    if (query) return metric.label.toLowerCase().includes(query);
    return sectionKey === activeSection;
  });
  const chartPoints = activeMetric
    ? filterByTimeframe(activeMetric.history, timeframe)
    : [];
  const comparisonPoints = comparisonMetric
    ? filterByTimeframe(comparisonMetric.history, timeframe)
    : [];

  function selectSection(key: MacroSectionKey) {
    setActiveSection(key);
    setSearch("");
    setActiveMetricId(profile.sections[key].indicators.find(isSelectableMetric)?.id ?? "");
  }

  function selectMetric(metricId: string, sectionKey: MacroSectionKey) {
    setActiveMetricId(metricId);
    setActiveSection(sectionKey);
    if (comparisonProfileId === profile.id && comparisonMetricId === metricId) {
      setComparisonMetricId("");
    }
  }

  return (
    <div className="space-y-3">
      <section className="desk-surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="terminal-label">{profile.countryCode} / {profile.currency}</p>
            <h2 className="mt-1 text-[18px] font-semibold text-[#f1f1f1]">{profile.country}</h2>
          </div>
          <dl className="grid grid-cols-2 gap-x-7 gap-y-3 sm:grid-cols-4">
            <HeaderMetric label="Central bank" value={profile.centralBank} />
            <HeaderMetric label="Policy rate" value={profile.policyRate} />
            <HeaderMetric label="Next meeting" value={profile.nextMeeting} />
            <HeaderMetric label="Status" value={profile.stance} />
          </dl>
        </div>

        <div className="p-4">
          <p className="terminal-label mb-3">Economy overview</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {profile.snapshot.map((item) => (
              <article key={item.label} className="rounded-md border border-[var(--line)] bg-[#131415] p-3">
                <p className="text-[10px] text-[#b5b5b5]">{item.label}</p>
                <div className="mt-5 flex items-end justify-between gap-2">
                  <p className="text-[20px] font-semibold tracking-[-0.03em] text-[#eeeeee] tabular-nums">
                    {item.value}
                  </p>
                  <p className={changeClass(item.change)}>{item.change ?? "—"}</p>
                </div>
                {item.latestDate ? (
                  <p className="mt-1 text-[8px] text-[#626467]">Latest / {item.latestDate}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="desk-surface grid min-h-[570px] overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--line)] bg-[#111213] p-4 xl:border-b-0 xl:border-r">
          <p className="terminal-label">Library</p>
          <label className="mt-4 block">
            <span className="sr-only">Search indicators</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search indicators"
              className="desk-field w-full px-3 py-2.5 text-[11px]"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[8px] uppercase tracking-[0.1em] text-[#5f6264]">
              Category
            </span>
            <select
              value={activeSection}
              onChange={(event) => selectSection(event.target.value as MacroSectionKey)}
              className="desk-field w-full px-3 py-2.5 text-[10px]"
            >
              {macroSectionOrder.map((key) => (
                <option key={key} value={key}>
                  {profile.sections[key].shortTitle}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 space-y-2">
            {visibleIndicators.map(({ metric, sectionKey }) => {
              const active = metric.id === activeMetric?.id;
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => selectMetric(metric.id, sectionKey)}
                  className={
                    active
                      ? "w-full rounded-md border border-[#46484a] bg-[#202123] px-3 py-3 text-left text-[11px] text-white"
                      : "w-full rounded-md border border-[var(--line)] bg-[#151617] px-3 py-3 text-left text-[11px] text-[#858585] hover:border-[#3a3b3d] hover:text-[#d0d0d0]"
                  }
                >
                  <span className="block">{metric.label}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[8px] text-[#606266]">
                    <span>{profile.sections[sectionKey].shortTitle}</span>
                    <span>{metric.value}</span>
                  </span>
                </button>
              );
            })}
            {visibleIndicators.length === 0 ? (
              <p className="py-8 text-center text-[10px] text-[#626467]">No matching indicator</p>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 p-4">
          <div className="border-b border-[var(--line)] pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-[#ededed]">
                {activeMetric?.label ?? "No indicator"}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-[#676a6d]">
                {activeMetric ? <SourceBadge source={activeMetric.source} /> : null}
                {activeMetric?.latestDate ? <span>Observation / {activeMetric.latestDate}</span> : null}
                {activeMetric?.sourceUpdatedDate ? (
                  <span>Source updated / {activeMetric.sourceUpdatedDate}</span>
                ) : null}
                {activeMetric?.stale ? <span className="text-[#bb9558]">Stale data</span> : null}
              </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 overflow-hidden rounded border border-[var(--line)]">
                  <ModeButton active={chartMode === "bars"} onClick={() => setChartMode("bars")}>
                    Bars
                  </ModeButton>
                  <ModeButton active={chartMode === "line"} onClick={() => setChartMode("line")}>
                    Line
                  </ModeButton>
                </div>
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value as Timeframe)}
                  className="desk-field w-[82px] px-2.5 py-2 text-[9px]"
                  aria-label="Chart timeframe"
                >
                  <option value="1Y">1Y</option>
                  <option value="3Y">3Y</option>
                  <option value="5Y">5Y</option>
                  <option value="ALL">All</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-center">
              <span className="w-16 shrink-0 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#686b6e]">
                Compare
              </span>
              <select
                value={comparisonProfileId}
                onChange={(event) => {
                  setComparisonProfileId(event.target.value);
                  setComparisonMetricId("");
                }}
                className="desk-field min-w-0 flex-1 px-2.5 py-2 text-[9px]"
                aria-label="Comparison country"
              >
                <option value="">1. Select country</option>
                {profiles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.country}
                  </option>
                ))}
              </select>
              <span className="hidden text-[10px] text-[#4f5154] sm:inline">→</span>
              <select
                value={comparisonMetricId}
                disabled={!comparisonProfile}
                onChange={(event) => {
                  setComparisonMetricId(event.target.value);
                  if (event.target.value) setChartMode("bars");
                }}
                className="desk-field min-w-0 flex-[1.35] px-2.5 py-2 text-[9px] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Comparison indicator"
              >
                <option value="">2. Select indicator</option>
                {comparisonEntries
                  .filter(
                    ({ metric }) =>
                      metric.history.length > 0 &&
                      !(
                        comparisonProfile?.id === profile.id &&
                        metric.id === activeMetric?.id
                      ),
                  )
                  .map(({ metric, sectionKey }) => (
                    <option key={metric.id} value={metric.id}>
                      {comparisonProfile?.sections[sectionKey].shortTitle} / {metric.label}
                    </option>
                  ))}
              </select>
              {comparisonProfileId ? (
                <button
                  type="button"
                  onClick={() => {
                    setComparisonProfileId("");
                    setComparisonMetricId("");
                  }}
                  className="desk-button shrink-0 px-2.5 py-2 text-[9px]"
                  aria-label="Clear comparison"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {comparisonMetric ? (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[9px]">
                <LegendDot color="var(--positive)" label={activeMetric?.label ?? "Primary"} />
                <LegendDot
                  color="#60a5fa"
                  label={comparisonProfile?.country + " / " + comparisonMetric.label}
                />
              </div>
            ) : null}
          </div>

          {activeMetric ? (
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[25px] font-semibold tracking-[-0.04em] text-[#f0f0f0] tabular-nums">
                  {activeMetric.value}
                </p>
                <p className={changeClass(activeMetric.change)}>{activeMetric.change ?? "—"}</p>
              </div>
              {activeMetric.context ? (
                <p className="max-w-[520px] text-right text-[8px] leading-4 text-[#5f6264]">
                  {activeMetric.context}
                </p>
              ) : null}
            </div>
          ) : null}

          {chartPoints.length > 0 ? (
            <div className="mt-2">
              <MacroIndicatorChart
                points={chartPoints}
                mode={chartMode}
                primaryLabel={activeMetric?.label}
                comparison={
                  comparisonMetric
                    ? {
                        label: comparisonProfile?.country + " / " + comparisonMetric.label,
                        points: comparisonPoints,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="flex h-[430px] items-center justify-center text-[11px] text-[#64676a]">
              {emptyChartMessage(activeMetric?.source)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function isSelectableMetric(metric: { history: MacroTrendPoint[]; source: MacroSource }) {
  return metric.history.length > 0 && metric.source !== "Demo" && metric.source !== "Coming soon" && metric.source !== "Not connected";
}

function firstConnectedMetric(profile: CountryMacroProfile) {
  return macroSectionOrder.flatMap((sectionKey) => profile.sections[sectionKey].indicators).find(isSelectableMetric);
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[#85878a]">
      <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "bg-[#eeeeee] px-3 py-2 text-[9px] font-semibold uppercase text-[#111]"
          : "bg-[#141516] px-3 py-2 text-[9px] font-semibold uppercase text-[#666]"
      }
    >
      {children}
    </button>
  );
}

function filterByTimeframe(points: MacroTrendPoint[], timeframe: Timeframe) {
  if (timeframe === "ALL" || points.length === 0) return points;
  const datedPoints = points.filter((point) => point.date && !Number.isNaN(Date.parse(point.date)));
  const latest = datedPoints.at(-1);
  if (!latest?.date) return points;

  const cutoff = new Date(latest.date);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - Number(timeframe.slice(0, -1)));
  return datedPoints.filter((point) => point.date && new Date(point.date) >= cutoff);
}

function SourceBadge({ source }: { source: MacroSource }) {
  const live = isLiveMacroSource(source);
  return (
    <span className={live ? "text-[#53b873]" : "text-[#777a7c]"}>
      {source}
    </span>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="terminal-label text-[7px]">{label}</dt>
      <dd className="mt-1 max-w-[175px] truncate text-[10px] text-[#c7c7c7]" title={value}>
        {value}
      </dd>
    </div>
  );
}

function changeClass(change?: string) {
  if (!change || change === "Flat" || change === "Hold") return "text-[9px] text-[#777a7c]";
  return change.trim().startsWith("-")
    ? "text-[9px] text-[var(--negative)]"
    : "text-[9px] text-[var(--positive)]";
}

function emptyChartMessage(source?: MacroSource) {
  if (source === "Not connected" || source === "Coming soon") return "Official data source not connected yet";
  if (source === "Data unavailable") return "Data unavailable from the configured source";
  return "No historical values yet";
}


