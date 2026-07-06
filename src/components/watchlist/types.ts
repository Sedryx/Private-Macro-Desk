import type { AssetType, Bias } from "@prisma/client";

export type AssetOptionView = {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currency: string | null;
  country: string | null;
  exchange: string | null;
};

export type WatchlistItemView = {
  id: string;
  assetId: string;
  bias: Bias | null;
  importantLevel: string | null;
  notes: string | null;
  asset: AssetOptionView;
};

export type WatchlistView = {
  id: string;
  name: string;
  items: WatchlistItemView[];
};
