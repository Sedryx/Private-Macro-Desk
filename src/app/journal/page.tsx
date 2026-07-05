import { TradeCreateForm } from "@/components/journal/TradeCreateForm";
import { TradeList, type TradeView } from "@/components/journal/TradeList";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getJournalData() {
  try {
    const [assets, users, trades] = await Promise.all([
      prisma.asset.findMany({
        orderBy: { symbol: "asc" },
        select: { id: true, symbol: true, name: true },
      }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.trade.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          direction: true,
          status: true,
          entryPrice: true,
          stopLoss: true,
          takeProfit: true,
          riskPercent: true,
          thesis: true,
          invalidation: true,
          result: true,
          mistakeTags: true,
          openedAt: true,
          closedAt: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
          asset: { select: { symbol: true, name: true } },
          notes: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              screenshotUrls: true,
              createdAt: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const tradeViews: TradeView[] = trades.map((trade) => ({
      ...trade,
      entryPrice: trade.entryPrice?.toString() ?? null,
      stopLoss: trade.stopLoss?.toString() ?? null,
      takeProfit: trade.takeProfit?.toString() ?? null,
      riskPercent: trade.riskPercent?.toString() ?? null,
      openedAt: trade.openedAt?.toISOString() ?? null,
      closedAt: trade.closedAt?.toISOString() ?? null,
      createdAt: trade.createdAt.toISOString(),
      notes: trade.notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
      })),
    }));

    return { assets, users, trades: tradeViews, databaseError: false };
  } catch (error) {
    console.error("Unable to load the trading journal", error);
    return { assets: [], users: [], trades: [], databaseError: true };
  }
}

export default async function JournalPage() {
  const { assets, users, trades, databaseError } = await getJournalData();

  return (
    <>
      <PageHeader
        eyebrow="Desk / Review"
        title="Trading Journal"
        description="Prepare the idea, follow its status and keep the reasoning visible to both traders."
      />

      {databaseError ? (
        <JournalMessage
          title="Journal unavailable"
          message="The desk cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page."
        />
      ) : (
        <div className="space-y-10">
          <TradeCreateForm assets={assets} users={users} />

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Review</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#e7ebe8]">Trade log</h2>
                <p className="mt-1 text-[13px] text-[#77817d]">Ideas and trades, newest first.</p>
              </div>
              <span className="text-[11px] text-[#68736e]">
                {trades.length} {trades.length === 1 ? "trade" : "trades"}
              </span>
            </div>
            <TradeList trades={trades} users={users} />
          </section>
        </div>
      )}
    </>
  );
}

function JournalMessage({ title, message }: { title: string; message: string }) {
  return (
    <section className="desk-surface px-6 py-16 text-center">
      <span className="mx-auto block h-px w-8 bg-[#56615b]" />
      <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">{message}</p>
    </section>
  );
}
