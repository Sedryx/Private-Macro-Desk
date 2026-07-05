import type { TradeDirection, TradeStatus } from "@prisma/client";

import { TradeCard } from "@/components/journal/TradeCard";

export type JournalUser = { id: string; name: string };

export type TradeView = {
  id: string;
  noteRequestId: string;
  userId: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  riskPercent: string | null;
  thesis: string;
  invalidation: string | null;
  result: string | null;
  mistakeTags: string[];
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  user: JournalUser;
  asset: { symbol: string; name: string };
  notes: Array<{
    id: string;
    content: string;
    screenshotUrls: string[];
    createdAt: string;
    user: { name: string };
  }>;
};

export function TradeList({ trades, users }: { trades: TradeView[]; users: JournalUser[] }) {
  if (trades.length === 0) {
    return (
      <div className="desk-surface px-6 py-14 text-center">
        <span className="mx-auto block h-px w-8 bg-[#56615b]" />
        <h3 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">No trades in the journal yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
          Create the first trade idea above. Its plan, status and discussion will stay together here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <TradeCard key={trade.id} trade={trade} users={users} />
      ))}
    </div>
  );
}
