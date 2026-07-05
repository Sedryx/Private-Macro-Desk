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

export type MacroChartPoint = {
  date: string;
  value: number;
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const tooltipDateFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function MacroIndicatorChart({
  points,
  unit,
  color,
}: {
  points: MacroChartPoint[];
  unit: string | null;
  color: string;
}) {
  const chartData = points.map((point) => ({
    date: point.date,
    label: monthFormatter.format(new Date(point.date)),
    value: point.value,
  }));

  return (
    <div className="h-[220px] w-full min-w-0" aria-label="Historical demo series chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke="#273036" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={26}
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
            labelFormatter={(_label, payload) => {
              const date = payload[0]?.payload?.date;
              return date ? tooltipDateFormatter.format(new Date(date)) : "";
            }}
            formatter={(value) => [`${Number(value).toFixed(2)}${unit ? ` ${unit}` : ""}`, "Demo value"]}
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
