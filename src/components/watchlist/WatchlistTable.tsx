import type { AssetType, Bias } from "@prisma/client";

import { WatchlistItemEditor } from "@/components/watchlist/WatchlistItemEditor";

export type WatchlistItemView = {
  id: string;
  bias: Bias | null;
  importantLevel: string | null;
  notes: string | null;
  asset: {
    symbol: string;
    name: string;
    type: AssetType;
    currency: string | null;
    country: string | null;
  };
};

export function WatchlistTable({ items }: { items: WatchlistItemView[] }) {
  return (
    <div className="grid gap-3 bg-[#0d1216] p-3 sm:p-4 xl:grid-cols-2">
      {items.map((item) => (
        <WatchlistItemEditor key={item.id} item={item} />
      ))}
    </div>
  );
}
