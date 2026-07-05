import Link from "next/link";
import type { AssetType, Bias } from "@prisma/client";

export type WatchlistSnapshotItem = {
  id: string;
  symbol: string;
  type: AssetType;
  bias: Bias | null;
  importantLevel: string | null;
  notes: string | null;
};

const biasTone = {
  BULLISH: "text-[#afbea5]",
  BEARISH: "text-[#ca9994]",
  NEUTRAL: "text-[#a9b1ad]",
};

export function WatchlistSnapshot({
  watchlistName,
  items,
}: {
  watchlistName: string | null;
  items: WatchlistSnapshotItem[];
}) {
  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Shared market map</p>
          <h2 className="mt-2 text-[15px] font-semibold text-[#e4e8e5]">Watchlist Snapshot</h2>
          <p className="mt-1 text-[12px] text-[#707b76]">{watchlistName ?? "No main watchlist found"}</p>
        </div>
        <Link href="/watchlist" className="text-[11px] font-medium text-[#9dad94] transition hover:text-[#d3ddd0]">
          Open list →
        </Link>
      </div>

      {!watchlistName ? (
        <EmptyMessage text="Run the seed or create the Main Watchlist to populate this snapshot." />
      ) : items.length === 0 ? (
        <EmptyMessage text="The main watchlist exists, but it has no assets yet." />
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {items.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-3.5 sm:grid-cols-[110px_90px_minmax(0,1fr)] sm:items-center sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-semibold text-[#e2e6e3]">{item.symbol}</span>
                <span className="rounded border border-[#30393e] bg-[#10161a] px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.06em] text-[#78837e]">
                  {item.type}
                </span>
              </div>
              <span className={`text-[10px] font-semibold ${item.bias ? biasTone[item.bias] : "text-[#5f6965]"}`}>
                {item.bias ? formatLabel(item.bias) : "Not set"}
              </span>
              <div className="min-w-0 sm:text-right">
                <p className="text-[11px] text-[#9da6a1]">{item.importantLevel || "No level"}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#616c67]">{item.notes || "No note yet"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <p className="px-6 py-10 text-center text-[12px] leading-5 text-[#707b76]">{text}</p>;
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
