import type { PricePoint } from "@/components/calendar/types";

const WINDOW_DAYS = 5;
const CHART_WIDTH = 320;
const CHART_HEIGHT = 90;

export function PriceReactionChart({
  pairLabel,
  points,
  eventTime,
}: {
  pairLabel: string;
  points: PricePoint[];
  eventTime: string;
}) {
  const eventDate = new Date(eventTime).getTime();
  const windowMs = WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const windowed = points.filter((point) => Math.abs(new Date(point.date).getTime() - eventDate) <= windowMs);

  if (windowed.length < 2) {
    return <p className="text-[9px] text-[#66716c]">Not enough {pairLabel} price history around this date.</p>;
  }

  const values = windowed.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (windowed.length - 1);

  const coords = windowed.map((point, index) => ({
    x: index * stepX,
    y: CHART_HEIGHT - ((point.value - min) / range) * CHART_HEIGHT,
    date: point.date,
    value: point.value,
  }));
  const linePoints = coords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" ");

  const markerIndex = coords.reduce(
    (closest, coord, index) =>
      Math.abs(new Date(coord.date).getTime() - eventDate) <
      Math.abs(new Date(coords[closest].date).getTime() - eventDate)
        ? index
        : closest,
    0,
  );
  const marker = coords[markerIndex];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.08em] text-[#66716c]">{pairLabel}</span>
        <span className="text-[9px] text-[#66716c]">
          {formatShort(windowed[0].date)} – {formatShort(windowed[windowed.length - 1].date)}
        </span>
      </div>
      <svg
        width="100%"
        height={CHART_HEIGHT + 4}
        viewBox={`0 -2 ${CHART_WIDTH} ${CHART_HEIGHT + 4}`}
        preserveAspectRatio="none"
        className="mt-2 overflow-visible"
        aria-hidden
      >
        <line
          x1={marker.x}
          y1={0}
          x2={marker.x}
          y2={CHART_HEIGHT}
          stroke="#3a453f"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <polyline points={linePoints} fill="none" stroke="#7f8984" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={marker.x} cy={marker.y} r={2.2} fill="#c8d0cb" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[9px] text-[#66716c]">
        <span>Low {min.toFixed(4)}</span>
        <span>High {max.toFixed(4)}</span>
      </div>
    </div>
  );
}

function formatShort(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(value));
}
