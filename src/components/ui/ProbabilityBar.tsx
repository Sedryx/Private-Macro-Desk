export function ProbabilityBar({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) {
  const width = value === 0 ? 0 : Math.max((value / max) * 100, 4);
  return (
    <div className="h-1.5 overflow-hidden rounded-sm bg-[#292a2c]">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}
