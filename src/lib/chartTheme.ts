export const chartTheme = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#d4d4d4",
  secondary: "#8a8a8a",
  grid: "rgba(161, 161, 161, 0.14)",
  axis: "#6f6f6f",
  cursor: "#55575a",
  plot: "#141516",
  tooltip: {
    background: "#111214",
    border: "#343538",
    text: "#f2f2f2",
  },
  // Currency/series identity only — never reuse for gain/loss or comparison semantics.
  categorical: [
    "#3987e5",
    "#199e70",
    "#c98500",
    "#008300",
    "#9085e9",
    "#e66767",
    "#d55181",
    "#d95926",
  ],
} as const;
