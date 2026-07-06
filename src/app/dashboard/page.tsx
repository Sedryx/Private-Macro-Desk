import { TradeStatus } from "@prisma/client";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DeskVisuals, type DistributionItem } from "@/components/dashboard/DeskVisuals";
import { MarketRegimeCard } from "@/components/dashboard/MarketRegimeCard";
import { PreTradeChecklist } from "@/components/dashboard/PreTradeChecklist";
import { TradeDeskSnapshot, type RecentTradeNote, type TradeDeskItem } from "@/components/dashboard/TradeDeskSnapshot";
import { WatchlistSnapshot, type WatchlistSnapshotItem } from "@/components/dashboard/WatchlistSnapshot";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OWNER_EMAIL = "joachim@private-macro-desk.local";

async function getDashboardData() {
  try {
    const [watchlists, tradeStatusRows, recentTrades, recentNotes, openTrades] = await Promise.all([
      prisma.watchlist.findMany({
        where: {
          user: { email: OWNER_EMAIL },
        },
        select: {
          name: true,
          items: {
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              bias: true,
              importantLevel: true,
              notes: true,
              updatedAt: true,
              asset: { select: { id: true, symbol: true, type: true } },
            },
          },
        },
      }),
      prisma.trade.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.trade.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          direction: true,
          status: true,
          riskPercent: true,
          thesis: true,
          createdAt: true,
          asset: { select: { symbol: true } },
        },
      }),
      prisma.tradeNote.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          screenshotUrls: true,
          createdAt: true,
          user: { select: { name: true } },
          trade: { select: { asset: { select: { symbol: true } } } },
        },
      }),
      prisma.trade.findMany({
        where: { status: TradeStatus.OPEN },
        select: { riskPercent: true },
      }),
    ]);

    const tradeCounts = {
      PLANNED: 0,
      OPEN: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };

    tradeStatusRows.forEach((row) => {
      tradeCounts[row.status] = row._count._all;
    });

    const seenAssetIds = new Set<string>();
    const uniqueWatchlistItems = watchlists
      .flatMap((watchlist) => watchlist.items)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .filter((item) => {
        if (seenAssetIds.has(item.asset.id)) return false;
        seenAssetIds.add(item.asset.id);
        return true;
      });

    const watchlistItems: WatchlistSnapshotItem[] = uniqueWatchlistItems
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        symbol: item.asset.symbol,
        type: item.asset.type,
        bias: item.bias,
        importantLevel: item.importantLevel,
        notes: item.notes,
      }));

    const biasCounts = { BULLISH: 0, BEARISH: 0, NEUTRAL: 0, NOT_SET: 0 };

    uniqueWatchlistItems.forEach((item) => {
      if (item.bias) {
        biasCounts[item.bias] += 1;
      } else {
        biasCounts.NOT_SET += 1;
      }
    });

    const tradeItems: TradeDeskItem[] = recentTrades.map((trade) => ({
      id: trade.id,
      symbol: trade.asset.symbol,
      direction: trade.direction,
      status: trade.status,
      riskPercent: trade.riskPercent?.toString() ?? null,
      thesis: trade.thesis,
      createdAt: trade.createdAt.toISOString(),
    }));

    const noteItems: RecentTradeNote[] = recentNotes.map((note) => ({
      id: note.id,
      symbol: note.trade.asset.symbol,
      author: note.user.name,
      content: note.content,
      screenshotCount: note.screenshotUrls.length,
      createdAt: note.createdAt.toISOString(),
    }));

    const openRiskValues = openTrades
      .map((trade) => trade.riskPercent?.toNumber())
      .filter((value): value is number => value !== undefined && Number.isFinite(value));

    const tradeStatuses: DistributionItem[] = [
      { label: "Planned", value: tradeCounts.PLANNED, color: "bg-[#8f9b91]" },
      { label: "Open", value: tradeCounts.OPEN, color: "bg-[#9daf93]" },
      { label: "Closed", value: tradeCounts.CLOSED, color: "bg-[#71838e]" },
      { label: "Cancelled", value: tradeCounts.CANCELLED, color: "bg-[#986f70]" },
    ];

    const watchlistBiases: DistributionItem[] = [
      { label: "Bullish", value: biasCounts.BULLISH, color: "bg-[#91a486]" },
      { label: "Bearish", value: biasCounts.BEARISH, color: "bg-[#a97874]" },
      { label: "Neutral", value: biasCounts.NEUTRAL, color: "bg-[#7b8882]" },
      { label: "Not set", value: biasCounts.NOT_SET, color: "bg-[#4f5955]" },
    ];

    return {
      databaseError: false,
      watchlistName:
        watchlists.length === 0
          ? null
          : watchlists.length === 1
            ? watchlists[0].name
            : `${watchlists.length} watchlists`,
      watchlistItems,
      watchlistTotal: uniqueWatchlistItems.length,
      latestAsset: uniqueWatchlistItems[0]
        ? {
            symbol: uniqueWatchlistItems[0].asset.symbol,
            updatedAt: uniqueWatchlistItems[0].updatedAt.toISOString(),
          }
        : null,
      tradeCounts,
      tradeItems,
      noteItems,
      tradeStatuses,
      watchlistBiases,
      openTradeCount: openTrades.length,
      sizedOpenTradeCount: openRiskValues.length,
      openRiskTotal: openRiskValues.reduce((sum, value) => sum + value, 0),
      largestOpenRisk: openRiskValues.length > 0 ? Math.max(...openRiskValues) : 0,
    };
  } catch (error) {
    console.error("Unable to load dashboard data", error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        eyebrow="Desk / Home"
        title="Desk overview"
        description="A quick read of the shared watchlist, active trade workflow and the latest journal context."
      />

      {!data ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Dashboard unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            The desk cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          <DashboardStats
            watchlistAssets={data.watchlistTotal}
            plannedTrades={data.tradeCounts.PLANNED}
            openTrades={data.tradeCounts.OPEN}
            closedTrades={data.tradeCounts.CLOSED}
            latestAsset={data.latestAsset}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <WatchlistSnapshot watchlistName={data.watchlistName} items={data.watchlistItems} />
            <TradeDeskSnapshot trades={data.tradeItems} notes={data.noteItems} />
          </div>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Internal data</p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#e6eae7]">Desk Visuals</h2>
              </div>
              <p className="hidden text-[10px] text-[#626d68] sm:block">No external market feed</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <DeskVisuals
                tradeStatuses={data.tradeStatuses}
                watchlistBiases={data.watchlistBiases}
                openRiskTotal={data.openRiskTotal}
                largestOpenRisk={data.largestOpenRisk}
                openTradeCount={data.openTradeCount}
                sizedOpenTradeCount={data.sizedOpenTradeCount}
              />
              <MarketRegimeCard />
            </div>
          </section>

          <PreTradeChecklist />
        </div>
      )}
    </>
  );
}
