"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chartTheme } from "@/lib/chartTheme";
import type { MacroTrendPoint } from "@/lib/macroProfiles";

type ComparisonSeries = {
  label: string;
  points: MacroTrendPoint[];
};

type ChartPoint = {
  key: string;
  label: string;
  value?: number;
  comparisonValue?: number;
};

export function MacroIndicatorChart({
  points,
  color = chartTheme.positive,
  mode = "line",
  primaryLabel = "Primary",
  comparison,
}: {
  points: MacroTrendPoint[];
  color?: string;
  mode?: "line" | "bars";
  primaryLabel?: string;
  comparison?: ComparisonSeries;
}) {
  const data = mergeSeries(points, comparison?.points);
  const hasComparison = Boolean(comparison);
  const axes = (
    <>
      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 5" vertical={false} />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        minTickGap={24}
        tick={{ fill: chartTheme.axis, fontSize: 9 }}
      />
      <YAxis
        yAxisId="left"
        axisLine={false}
        tickLine={false}
        width={52}
        domain={["auto", "auto"]}
        tick={{ fill: chartTheme.axis, fontSize: 9 }}
        tickFormatter={formatAxis}
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
        formatter={(value, name) => [
          Number(value).toLocaleString("en-GB", { maximumFractionDigits: 2 }),
          name,
        ]}
      />
    </>
  );

  return (
    <div className="h-[340px] w-full min-w-0 lg:h-[430px]" aria-label="Macro trend chart">
      <ResponsiveContainer width="100%" height="100%">
        {mode === "bars" ? (
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 0, left: -8 }}
            accessibilityLayer
            barGap={1}
          >
            {axes}
            <Bar
              yAxisId="left"
              dataKey="value"
              name={primaryLabel}
              fill={color}
              isAnimationActive={false}
              radius={[1, 1, 0, 0]}
            >
              {!hasComparison
                ? data.map((point) => (
                    <Cell
                      key={point.key}
                      fill={(point.value ?? 0) < 0 ? chartTheme.negative : chartTheme.positive}
                    />
                  ))
                : null}
            </Bar>
            {comparison ? (
              <Bar
                yAxisId="left"
                dataKey="comparisonValue"
                name={comparison.label}
                fill="#60a5fa"
                isAnimationActive={false}
                radius={[1, 1, 0, 0]}
              />
            ) : null}
          </BarChart>
        ) : comparison ? (
          <LineChart
            data={data}
            margin={{ top: 10, right: 0, bottom: 0, left: -8 }}
            accessibilityLayer
          >
            {axes}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              name={primaryLabel}
              stroke={color}
              strokeWidth={1.8}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="comparisonValue"
              name={comparison.label}
              stroke="#60a5fa"
              strokeWidth={1.8}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 0, left: -8 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id="macro-line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="86%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="value"
              name={primaryLabel}
              stroke={color}
              strokeWidth={1.8}
              fill="url(#macro-line-fill)"
              dot={false}
              activeDot={{ r: 3.5, fill: color, stroke: chartTheme.plot, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function mergeSeries(
  primary: MacroTrendPoint[],
  comparison?: MacroTrendPoint[],
): ChartPoint[] {
  const merged = new Map<string, ChartPoint>();

  for (const point of primary) {
    const key = periodKey(point);
    merged.set(key, {
      key,
      label: periodLabel(point),
      value: point.value,
    });
  }

  for (const point of comparison ?? []) {
    const key = periodKey(point);
    const current = merged.get(key);
    merged.set(key, {
      key,
      label: current?.label ?? periodLabel(point),
      value: current?.value,
      comparisonValue: point.value,
    });
  }

  return [...merged.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function periodKey(point: MacroTrendPoint) {
  return point.date?.slice(0, 7) ?? point.label;
}

function periodLabel(point: MacroTrendPoint) {
  if (!point.date) return point.label;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(point.date));
}

function formatAxis(value: number) {
  return new Intl.NumberFormat("en-GB", {
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}
