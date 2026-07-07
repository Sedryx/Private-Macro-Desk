"use client";

import { useMemo, useState } from "react";
import type { DailyTrend, EntrySignal, EntryZone, TradeDirection, TradeStatus } from "@prisma/client";

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
  strategyCode: string | null;
  dailyTrend: DailyTrend | null;
  entryZone: EntryZone | null;
  entrySignal: EntrySignal | null;
  setupValid: boolean;
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

type StatusFilter = "ALL" | TradeStatus;
type SortMode = "NEWEST" | "OLDEST" | "STATUS" | "RISK";

type CollapseMode = "AUTO" | "ALL_COLLAPSED" | "ALL_EXPANDED";

const statusOrder: Record<TradeStatus, number> = {
  OPEN: 0,
  PLANNED: 1,
  CLOSED: 2,
  CANCELLED: 3,
};

export function TradeList({ trades, users }: { trades: TradeView[]; users: JournalUser[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [collapseMode, setCollapseMode] = useState<CollapseMode>("AUTO");

  const visibleTrades = useMemo(() => {
    return trades
      .filter((trade) => statusFilter === "ALL" || trade.status === statusFilter)
      .toSorted((left, right) => {
        if (sortMode === "OLDEST") return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        if (sortMode === "STATUS") return statusOrder[left.status] - statusOrder[right.status];
        if (sortMode === "RISK") return Number(right.riskPercent ?? 0) - Number(left.riskPercent ?? 0);
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [sortMode, statusFilter, trades]);

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
      <div className="desk-surface flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ControlSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
            <option value="ALL">All status</option>
            <option value="OPEN">Open</option>
            <option value="PLANNED">Planned</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </ControlSelect>
          <ControlSelect label="Sort" value={sortMode} onChange={(value) => setSortMode(value as SortMode)}>
            <option value="NEWEST">Newest first</option>
            <option value="STATUS">Open / planned first</option>
            <option value="RISK">Highest risk first</option>
            <option value="OLDEST">Oldest first</option>
          </ControlSelect>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#69746f]">{visibleTrades.length} / {trades.length} trades</span>
          <button type="button" onClick={() => setCollapseMode("AUTO")} className={toggleClass(collapseMode === "AUTO")}>Auto</button>
          <button type="button" onClick={() => setCollapseMode("ALL_COLLAPSED")} className={toggleClass(collapseMode === "ALL_COLLAPSED")}>Collapse all</button>
          <button type="button" onClick={() => setCollapseMode("ALL_EXPANDED")} className={toggleClass(collapseMode === "ALL_EXPANDED")}>Expand all</button>
        </div>
      </div>

      {visibleTrades.length === 0 ? (
        <div className="desk-surface px-6 py-10 text-center text-[13px] text-[#7d8883]">
          No trades match this filter.
        </div>
      ) : (
        visibleTrades.map((trade) => (
          <TradeCard
            key={`${trade.id}-${collapseMode}`}
            trade={trade}
            users={users}
            initialCollapsed={collapseMode === "ALL_COLLAPSED" || (collapseMode === "AUTO" && ["CLOSED", "CANCELLED"].includes(trade.status))}
          />
        ))
      )}
    </div>
  );
}

function ControlSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[#0c1013] px-2.5 py-2">
      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#65706b]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent text-[11px] font-semibold text-[#d9dfdb] outline-none">
        {children}
      </select>
    </label>
  );
}

function toggleClass(active: boolean) {
  return `rounded-lg border px-3 py-2 text-[10px] font-semibold transition ${
    active
      ? "border-[#5e6d62] bg-[#18231b] text-[#bfe8c4]"
      : "border-[var(--line)] bg-[#0c1013] text-[#87918c] hover:border-[#3a4540] hover:text-[#d6ddd9]"
  }`;
}
