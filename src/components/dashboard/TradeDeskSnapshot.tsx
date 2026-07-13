import Link from "next/link";
import type { TradeDirection, TradeStatus } from "@prisma/client";

export type TradeDeskItem = {
  id: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  riskPercent: string | null;
  thesis: string;
  createdAt: string;
};

export type RecentTradeNote = {
  id: string;
  symbol: string;
  author: string;
  content: string;
  screenshotCount: number;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
});

const directionTone = {
  LONG: "text-[var(--positive)]",
  SHORT: "text-[var(--negative)]",
};

export function TradeDeskSnapshot({ trades, notes }: { trades: TradeDeskItem[]; notes: RecentTradeNote[] }) {
  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-5">
        <div>
          <p className="terminal-label">Journal activity // Latest</p>
          <h2 className="mt-2 text-[15px] font-semibold text-[#e4e8e5]">Trade Desk</h2>
        </div>
        <Link href="/journal" className="text-[10px] font-medium text-[#a3a3a3] transition hover:text-white">
          Open journal →
        </Link>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
        <div className="divide-y divide-[var(--line)] lg:border-r lg:border-[var(--line)] lg:border-y-0 lg:border-l-0">
          {trades.length === 0 ? (
            <EmptyMessage text="No trades logged yet" />
          ) : (
            trades.map((trade) => (
              <div key={trade.id} className="px-5 py-3.5 sm:px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-[#e2e6e3]">{trade.symbol}</span>
                  <span className={`text-[9px] font-semibold ${directionTone[trade.direction]}`}>{trade.direction}</span>
                  <span className="rounded-full border border-[#30393e] bg-[#11171b] px-2 py-0.5 text-[8px] font-semibold text-[#88928d]">
                    {formatLabel(trade.status)}
                  </span>
                  <span className="ml-auto text-[9px] text-[#5f6965]">{dateFormatter.format(new Date(trade.createdAt))}</span>
                </div>
                <p className="mt-2 truncate text-[11px] text-[#7f8984]">{trade.thesis}</p>
                <p className="mt-1 text-[9px] text-[#5f6965]">Risk: {trade.riskPercent ? `${trade.riskPercent}%` : "Not set"}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-[#0f1519] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold text-[#b7bfba]">Latest notes</h3>
            <span className="text-[9px] text-[#5f6965]">{notes.length}</span>
          </div>
          {notes.length === 0 ? (
            <p className="mt-5 text-[11px] text-[#68736e]">No notes yet</p>
          ) : (
            <div className="mt-3 space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3 text-[9px] text-[#65706b]">
                    <span>{note.symbol} · {note.author}</span>
                    <span>{dateFormatter.format(new Date(note.createdAt))}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[10px] text-[#8a948f]">{note.content}</p>
                  {note.screenshotCount > 0 ? <p className="mt-1 text-[9px] text-[#78867a]">{note.screenshotCount} screenshot{note.screenshotCount > 1 ? "s" : ""}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <p className="px-6 py-10 text-center text-[12px] text-[#707b76]">{text}</p>;
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
