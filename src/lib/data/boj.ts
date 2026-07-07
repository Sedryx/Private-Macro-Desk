import type { UnresolvedOfficialSeriesConfig } from "@/lib/data/global-series";

export async function syncBojSeries(config: UnresolvedOfficialSeriesConfig): Promise<never> {
  throw new Error(`${config.code} is not connected: ${config.discoveryHint}`);
}
