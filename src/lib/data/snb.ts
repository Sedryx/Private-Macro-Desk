import type { UnresolvedOfficialSeriesConfig } from "@/lib/data/global-series";

export async function syncSnbSeries(config: UnresolvedOfficialSeriesConfig): Promise<never> {
  throw new Error(`${config.code} is not connected: ${config.discoveryHint}`);
}
