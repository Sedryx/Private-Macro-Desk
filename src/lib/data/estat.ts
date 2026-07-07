import type { UnresolvedOfficialSeriesConfig } from "@/lib/data/global-series";

export async function syncEstatSeries(config: UnresolvedOfficialSeriesConfig): Promise<never> {
  if (!process.env.E_STAT_APP_ID) {
    throw new Error(`${config.code} is not connected: E_STAT_APP_ID is required for e-Stat metadata discovery.`);
  }
  throw new Error(`${config.code} is not connected: ${config.discoveryHint}`);
}
