import { TradeStatus } from "@prisma/client";

import { CalendarBriefingWidget } from "@/components/dashboard/CalendarBriefingWidget";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DeskVisuals, type DistributionItem } from "@/components/dashboard/DeskVisuals";
import { MacroPulseCard } from "@/components/dashboard/MacroPulseCard";
import { MacroSnapshotWidget } from "@/components/dashboard/MacroSnapshotWidget";
import { PreTradeChecklist } from "@/components/dashboard/PreTradeChecklist";
import { TodayFocusCard } from "@/components/dashboard/TodayFocusCard";
import { TradeDeskSnapshot, type RecentTradeNote, type TradeDeskItem } from "@/components/dashboard/TradeDeskSnapshot";
import { WatchlistSnapshot, type WatchlistSnapshotItem } from "@/components/dashboard/WatchlistSnapshot";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  addDays,
  buildMacroPulse,
  getTodayTomorrowKeys,
  getZurichDateKey,
  sortBriefingEvents,
  type CalendarBriefingEvent,
  type MacroSnapshotItem,
} from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


const macroSnapshotDefinitions = [
  { code: "FEDFUNDS", label: "Fed funds" },
  { code: "US_CPI_YOY", label: "US CPI YoY" },
  { code: "US_UNEMPLOYMENT", label: "US unemployment" },
  { code: "US10Y", label: "US 10Y" },
  { code: "US_2Y10Y_CURVE", label: "2Y10Y curve" },
  { code: "US_DOLLAR_BROAD_INDEX", label: "Broad USD" },
] as const;

const macroCodesForDashboard = [
  ...macroSnapshotDefinitions.map((definition) => definition.code),
  "US1Y",
  "US2Y",
];

async function getDashboardData() {
  try {
    const now = new Date();
    const { todayKey, tomorrowKey } = getTodayTomorrowKeys(now);

    const [watchlists, tradeStatusRows, recentTrades, recentNotes, openTrades, economicEvents, macroIndicators] = await Promise.all([
      prisma.watchlist.findMany({
        where: {
          user: { role: "OWNER" },
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
      prisma.economicEvent.findMany({
        where: {
          eventTime: {
            gte: addDays(now, -1),
            lte: addDays(now, 2),
          },
        },
        orderBy: { eventTime: "asc" },
        select: {
          id: true,
          title: true,
          country: true,
          currency: true,
          importance: true,
          eventTime: true,
          previousValue: true,
          forecastValue: true,
          actualValue: true,
        },
      }),
      prisma.macroIndicator.findMany({
        where: { code: { in: macroCodesForDashboard } },
        select: {
          code: true,
          unit: true,
          values: {
            take: 2,
            orderBy: { date: "desc" },
            select: { date: true, value: true },
          },
        },
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

    const calendarEvents: CalendarBriefingEvent[] = sortBriefingEvents(
      economicEvents
        .map((event) => ({
          id: event.id,
          title: event.title,
          country: event.country,
          currency: event.currency,
          importance: event.importance,
          eventTime: event.eventTime.toISOString(),
          previousValue: event.previousValue,
          forecastValue: event.forecastValue,
          actualValue: event.actualValue,
          dayKey: getZurichDateKey(event.eventTime),
        }))
        .filter((event) => (event.dayKey === todayKey || event.dayKey === tomorrowKey) && event.importance !== "LOW"),
    );

    const macroByCode = new Map(macroIndicators.map((indicator) => [indicator.code, indicator]));

    const buildMacroSnapshotItem = (code: string, label: string): MacroSnapshotItem => {
      const indicator = macroByCode.get(code);
      const latest = indicator?.values[0];
      const previous = indicator?.values[1];
      const value = latest?.value.toNumber() ?? null;
      const previousValue = previous?.value.toNumber() ?? null;

      return {
        code,
        label,
        value,
        unit: indicator?.unit ?? null,
        date: latest?.date.toISOString() ?? null,
        delta: value !== null && previousValue !== null ? value - previousValue : null,
        deltaUnit: getMacroDeltaUnit(code, indicator?.unit ?? null),
      };
    };

    const macroSnapshot = macroSnapshotDefinitions.map((definition) =>
      buildMacroSnapshotItem(definition.code, definition.label),
    );

    const macroPulse = buildMacroPulse([
      ...macroSnapshot,
      buildMacroSnapshotItem("US1Y", "US 1Y"),
      buildMacroSnapshotItem("US2Y", "US 2Y"),
    ]);

    const tradeStatuses: DistributionItem[] = [
      { label: "Planned", value: tradeCounts.PLANNED, color: "bg-[#a3a3a3]" },
      { label: "Open", value: tradeCounts.OPEN, color: "bg-[var(--positive)]" },
      { label: "Closed", value: tradeCounts.CLOSED, color: "bg-[#737373]" },
      { label: "Cancelled", value: tradeCounts.CANCELLED, color: "bg-[var(--negative)]" },
    ];

    const watchlistBiases: DistributionItem[] = [
      { label: "Bullish", value: biasCounts.BULLISH, color: "bg-[var(--positive)]" },
      { label: "Bearish", value: biasCounts.BEARISH, color: "bg-[var(--negative)]" },
      { label: "Neutral", value: biasCounts.NEUTRAL, color: "bg-[#a3a3a3]" },
      { label: "Not set", value: biasCounts.NOT_SET, color: "bg-[#525252]" },
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
      calendarEvents,
      todayKey,
      tomorrowKey,
      macroSnapshot,
      macroPulse,
    };
  } catch (error) {
    console.error("Unable to load dashboard data", error);
    return null;
  }
}

function getMacroDeltaUnit(code: string, unit: string | null): MacroSnapshotItem["deltaUnit"] {
  if (code.includes("10Y") || code.includes("1Y") || code.includes("2Y") || code.includes("CURVE") || code === "FEDFUNDS") {
    return "bp";
  }

  if (unit === "%") return "pp";

  return "value";
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader eyebrow="Desk / Home" title="Desk overview" />

      {!data ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Dashboard unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            Can&apos;t reach PostgreSQL. Start the database, check DATABASE_URL, then refresh.
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            <CalendarBriefingWidget events={data.calendarEvents} todayKey={data.todayKey} tomorrowKey={data.tomorrowKey} />
            <TodayFocusCard />
          </div>

          <MacroSnapshotWidget items={data.macroSnapshot} />

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
              <MacroPulseCard pulse={data.macroPulse} />
            </div>
          </section>

          <PreTradeChecklist />
        </div>
      )}
    </>
  );
}
