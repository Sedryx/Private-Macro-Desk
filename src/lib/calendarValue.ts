export function parseComparableValue(value: string | null): number | null {
  if (!value) return null;
  const match = value.replaceAll(",", "").match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return null;
  const suffix = value.toUpperCase();
  if (suffix.includes("T")) return parsed * 1_000_000_000_000;
  if (suffix.includes("B")) return parsed * 1_000_000_000;
  if (suffix.includes("M")) return parsed * 1_000_000;
  if (suffix.includes("K")) return parsed * 1_000;
  return parsed;
}
