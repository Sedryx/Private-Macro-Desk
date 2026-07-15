"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { chartTheme } from "@/lib/chartTheme";
import type { CurrencyVolatilitySeries } from "@/lib/data/currencyVolatility.server";

export function CurrencyVolatilityChart({ series }: { series: CurrencyVolatilitySeries[] }) {
  if (series.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center px-4 text-center text-[11px] text-[#6f7a75]">
        FX data not available yet — run <span className="mx-1 font-mono text-[#9aa49f]">npm run data:fx</span>.
      </div>
    );
  }

  const data = mergeSeries(series);
  const colorFor = (index: number) => chartTheme.categorical[index % chartTheme.categorical.length];

  return (
    <div>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -8 }} accessibilityLayer>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 5" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={32}
              tick={{ fill: chartTheme.axis, fontSize: 9 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              tick={{ fill: chartTheme.axis, fontSize: 9 }}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              cursor={{ stroke: chartTheme.cursor, strokeDasharray: "2 3" }}
              contentStyle={{
                border: "1px solid " + chartTheme.tooltip.border,
                borderRadius: 6,
                background: chartTheme.tooltip.background,
                color: chartTheme.tooltip.text,
                fontSize: 10,
                boxShadow: "0 14px 34px rgba(0,0,0,.38)",
              }}
              labelStyle={{ color: chartTheme.axis }}
              formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
            />
            {series.map((entry, index) => (
              <Line
                key={entry.currency}
                type="monotone"
                dataKey={entry.currency}
                name={entry.currency}
                stroke={colorFor(index)}
                strokeWidth={1.8}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((entry, index) => {
          const last = entry.points.at(-1)?.pctChange ?? 0;
          return (
            <div key={entry.currency} className="flex items-center gap-1.5 text-[9px]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorFor(index) }} />
              <span className="font-semibold text-[#c5cdc8]">{entry.currency}</span>
              <span className={last >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                {last >= 0 ? "+" : ""}
                {last.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function mergeSeries(series: CurrencyVolatilitySeries[]) {
  const merged = new Map<string, Record<string, number | string>>();

  for (const entry of series) {
    for (const point of entry.points) {
      const key = point.date.slice(0, 10);
      const label = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
        new Date(point.date),
      );
      const row = merged.get(key) ?? { key, label };
      row[entry.currency] = point.pctChange;
      merged.set(key, row);
    }
  }

  return [...merged.values()].sort((left, right) => String(left.key).localeCompare(String(right.key)));
}
