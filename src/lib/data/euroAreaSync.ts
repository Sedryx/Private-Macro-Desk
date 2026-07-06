import { syncEcbSeries } from "@/lib/data/ecb";
import { OFFICIAL_EURO_AREA_SERIES } from "@/lib/data/euroAreaConfig";
import { syncEurostatSeries } from "@/lib/data/eurostat";
import { FRED_SERIES, syncFredSeries } from "@/lib/data/fred";

export async function syncEuroAreaData() {
  const results: Array<{ code: string; source: string; valueCount: number }> = [];
  const failures: Array<{ code: string; message: string }> = [];

  for (const config of OFFICIAL_EURO_AREA_SERIES) {
    try {
      const result = config.provider === "EUROSTAT"
        ? await syncEurostatSeries(config)
        : await syncEcbSeries(config);
      results.push({ code: result.code, source: result.source, valueCount: result.valueCount });
      continue;
    } catch (officialError) {
      const fallback = FRED_SERIES.find((series) => series.code === config.code);
      if (fallback && process.env.FRED_API_KEY) {
        try {
          const result = await syncFredSeries(
            fallback,
            process.env.FRED_API_KEY,
            "FRED fallback",
          );
          results.push({ code: result.code, source: "FRED fallback", valueCount: result.valueCount });
          console.warn(
            `[Macro sync] ${config.code}: official source failed; FRED fallback used.`,
          );
          continue;
        } catch (fallbackError) {
          failures.push({
            code: config.code,
            message: `${errorMessage(officialError)}; fallback: ${errorMessage(fallbackError)}`,
          });
          continue;
        }
      }

      failures.push({ code: config.code, message: errorMessage(officialError) });
    }
  }

  return { results, failures };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown provider error";
}
