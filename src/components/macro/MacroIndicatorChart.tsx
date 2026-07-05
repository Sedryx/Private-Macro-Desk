"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MacroTrendPoint } from "@/lib/macroProfiles";

export function MacroIndicatorChart({
  points,
  color = "#9daf93",
}: {
  points: MacroTrendPoint[];
  color?: string;
}) {
  return (
    <div className="h-[260px] w-full min-w-0 sm:h-[300px]" aria-label="Demo macro trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: -10 }} accessibilityLayer>
          <CartesianGrid stroke="#273036" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={22}
            tick={{ fill: "#66716c", fontSize: 9 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={46}
            domain={["auto", "auto"]}
            tick={{ fill: "#66716c", fontSize: 9 }}
            tickFormatter={(value: number) => value.toFixed(2)}
          />
          <Tooltip
            cursor={{ stroke: "#4a5650", strokeDasharray: "3 3" }}
            contentStyle={{
              border: "1px solid #343d42",
              borderRadius: 8,
              background: "#10161a",
              color: "#dce2de",
              fontSize: 11,
              boxShadow: "0 12px 30px rgba(0,0,0,.28)",
            }}
            formatter={(value) => [Number(value).toFixed(2), "Value"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "#0b0f13", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
