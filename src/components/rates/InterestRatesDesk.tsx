"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chartTheme } from "@/lib/chartTheme";

export type RateSeriesView = {
  code: string;
  label: string;
  source: string | null;
  points: Array<{ date: string; value: number }>;
};

export type CentralBankRatesView = {
  id: string;
  label: string;
  currency: string;
  series: RateSeriesView[];
};

export function InterestRatesDesk({ banks }: { banks: CentralBankRatesView[] }) {
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const bank = banks.find((item) => item.id === bankId) ?? banks[0];
  const primary = bank?.series[0];
  const latest = primary?.points.at(-1);
  const previous = primary?.points.at(-2);
  const change = latest && previous ? latest.value - previous.value : null;
  const chartPoints = useMemo(
    () =>
      (primary?.points ?? []).map((point) => ({
        label: formatDate(point.date),
        value: point.value,
      })),
    [primary],
  );

  if (!bank) {
    return <section className="desk-surface px-6 py-16 text-center text-[12px] text-[#777]">No rate series available.</section>;
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="terminal-label">Interest rates // Internal macro database</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] text-white sm:text-[31px]">
            Central bank rates
          </h1>
        </div>
        <select
          value={bank.id}
          onChange={(event) => setBankId(event.target.value)}
          className="desk-field w-full px-3 py-2 text-[11px] sm:w-52"
        >
          {banks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RateCard label="Policy rate" value={latest ? formatPercent(latest.value) : "Unavailable"} tone="positive" />
        <RateCard
          label="Last change"
          value={change === null ? "Unavailable" : formatBasisPoints(change)}
          tone={change === null || change === 0 ? "neutral" : change > 0 ? "negative" : "positive"}
        />
        <RateCard label="Observation" value={latest ? formatLongDate(latest.date) : "Unavailable"} />
        <RateCard label="Source" value={primary?.source || "Unavailable"} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <section className="desk-surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div>
              <p className="terminal-label">Policy history // {bank.currency}</p>
              <h2 className="mt-1.5 text-[14px] font-semibold text-[#eeeeee]">
                {primary?.label ?? bank.label}
              </h2>
            </div>
            <span className="rounded border border-[#343538] bg-[#101112] px-2 py-1 text-[8px] text-[#818184]">
              {primary?.source || "No source"}
            </span>
          </header>
          {chartPoints.length > 0 ? (
            <div className="h-[360px] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 12, right: 14, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 5" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: chartTheme.axis, fontSize: 9 }} />
                  <YAxis axisLine={false} tickLine={false} width={44} tick={{ fill: chartTheme.axis, fontSize: 9 }} tickFormatter={(value: number) => value.toFixed(2) + "%"} />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltip.background,
                      border: "1px solid " + chartTheme.tooltip.border,
                      borderRadius: 6,
                      color: chartTheme.tooltip.text,
                      fontSize: 10,
                    }}
                    formatter={(value) => [formatPercent(Number(value)), "Rate"]}
                  />
                  <Line type="stepAfter" dataKey="value" stroke={chartTheme.positive} strokeWidth={1.8} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="px-5 py-24 text-center text-[11px] text-[#69696b]">Rate history unavailable.</p>
          )}
        </section>

        <section className="desk-surface p-4">
          <p className="terminal-label">Available curves // {bank.label}</p>
          <div className="mt-4 space-y-2">
            {bank.series.map((series) => {
              const point = series.points.at(-1);
              return (
                <div key={series.code} className="flex items-center justify-between rounded-md border border-[#2e2f31] bg-[#111214] px-3 py-3">
                  <div>
                    <p className="text-[10px] text-[#bdbdbd]">{series.label}</p>
                    <p className="mt-1 text-[8px] text-[#656567]">{series.source || "No source"}</p>
                  </div>
                  <span className="font-mono text-[13px] font-semibold text-[#eeeeee]">
                    {point ? formatPercent(point.value) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <p className="terminal-label">Decision probabilities</p>
            <p className="mt-2 text-[10px] leading-5 text-[#69696b]">
              Not connected. Cut/hold/hike probabilities require a dedicated futures or OIS source.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function RateCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const color = tone === "positive"
    ? "text-[var(--positive)]"
    : tone === "negative"
      ? "text-[var(--negative)]"
      : "text-[#eeeeee]";
  return (
    <article className="desk-surface p-4">
      <p className="terminal-label">{label}</p>
      <p className={"mt-2 truncate text-[19px] font-semibold tabular-nums " + color}>{value}</p>
    </article>
  );
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + "%";
}

function formatBasisPoints(change: number) {
  const value = Math.round(change * 100);
  return (value > 0 ? "+" : "") + value + " bp";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
