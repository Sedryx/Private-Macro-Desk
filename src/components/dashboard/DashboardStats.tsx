import { StatCard } from "@/components/ui/StatCard";

type DashboardStatsProps = {
  watchlistAssets: number;
  plannedTrades: number;
  openTrades: number;
  closedTrades: number;
  latestAsset: { symbol: string; updatedAt: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
});

export function DashboardStats({
  watchlistAssets,
  plannedTrades,
  openTrades,
  closedTrades,
  latestAsset,
}: DashboardStatsProps) {
  return (
    <section aria-label="Desk summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Watchlist assets" value={String(watchlistAssets)} detail="In the main shared list" />
      <StatCard label="Planned trades" value={String(plannedTrades)} detail="Waiting for a decision" />
      <StatCard label="Open trades" value={String(openTrades)} detail="Currently active" tone={openTrades > 0 ? "positive" : "neutral"} />
      <StatCard label="Closed trades" value={String(closedTrades)} detail="Completed journal records" />
      <StatCard
        label="Latest updated asset"
        value={latestAsset?.symbol ?? "None"}
        detail={latestAsset ? `Updated ${dateFormatter.format(new Date(latestAsset.updatedAt))}` : "No watchlist activity yet"}
      />
    </section>
  );
}
