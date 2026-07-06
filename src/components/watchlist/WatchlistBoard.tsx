import { WatchlistSection } from "@/components/watchlist/WatchlistSection";
import type {
  AssetOptionView,
  WatchlistView,
} from "@/components/watchlist/types";

export function WatchlistBoard({
  watchlists,
  assets,
}: {
  watchlists: WatchlistView[];
  assets: AssetOptionView[];
}) {
  return (
    <div className="space-y-4">
      {watchlists.map((watchlist) => (
        <WatchlistSection
          key={watchlist.id}
          watchlist={watchlist}
          assets={assets}
        />
      ))}
    </div>
  );
}
