import { OFFICIAL_EURO_AREA_SERIES } from "@/lib/data/euroAreaConfig";
import { syncEuroAreaData } from "@/lib/data/euroAreaSync";
import { FRED_SERIES, syncFredSeries } from "@/lib/data/fred";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 30 * 1000;
const US_FRED_SERIES = FRED_SERIES.filter((series) => series.country === "US");
const EXPECTED_CODES = [
  ...US_FRED_SERIES.map((series) => series.code),
  ...OFFICIAL_EURO_AREA_SERIES.map((series) => series.code),
];

type SchedulerState = {
  timer?: ReturnType<typeof setInterval>;
  initialCheck?: ReturnType<typeof setTimeout>;
  running?: Promise<unknown>;
};

const globalForMacroScheduler = globalThis as typeof globalThis & {
  macroSchedulerState?: SchedulerState;
};

export function startFredScheduler() {
  const state = globalForMacroScheduler.macroSchedulerState ??
    (globalForMacroScheduler.macroSchedulerState = {});
  if (state.timer) return;

  const checkAndSync = () => {
    if (state.running) return;
    state.running = syncMacroIfStale()
      .catch((error: unknown) => {
        console.error("[Macro scheduler] Sync failed:", errorMessage(error));
      })
      .finally(() => {
        state.running = undefined;
      });
  };

  state.initialCheck = setTimeout(checkAndSync, INITIAL_CHECK_DELAY_MS);
  state.initialCheck.unref();
  state.timer = setInterval(checkAndSync, TWO_HOURS_MS);
  state.timer.unref();
  console.log("[Macro scheduler] Official Euro Area + US FRED sync enabled every 2 hours.");
}

export async function syncMacroIfStale(force = false) {
  const { prisma } = await import("@/lib/prisma");
  const existingIndicators = await prisma.macroIndicator.findMany({
    where: { code: { in: EXPECTED_CODES } },
    select: { code: true, updatedAt: true },
  });
  const oldestUpdate = existingIndicators.reduce<Date | null>(
    (oldest, indicator) =>
      oldest === null || indicator.updatedAt < oldest ? indicator.updatedAt : oldest,
    null,
  );
  const complete = existingIndicators.length === EXPECTED_CODES.length;
  const fresh = complete && oldestUpdate !== null &&
    Date.now() - oldestUpdate.getTime() < TWO_HOURS_MS;

  if (!force && fresh) {
    console.log("[Macro scheduler] Data is still fresh; sync skipped.");
    return { status: "fresh" as const, failures: [] as string[] };
  }

  console.log("[Macro scheduler] Refreshing official Euro Area and US data...");
  const failures: string[] = [];

  if (process.env.FRED_API_KEY) {
    for (const series of US_FRED_SERIES) {
      try {
        const result = await syncFredSeries(series);
        console.log(`[Macro scheduler] ${result.code}: ${result.valueCount} FRED values.`);
      } catch (error) {
        failures.push(series.code);
        console.error(`[Macro scheduler] ${series.code}: ${errorMessage(error)}`);
      }
    }
  } else {
    console.warn("[Macro scheduler] FRED_API_KEY missing; US refresh skipped.");
  }

  const euroArea = await syncEuroAreaData();
  for (const result of euroArea.results) {
    console.log(`[Macro scheduler] ${result.code}: ${result.valueCount} ${result.source} values.`);
  }
  for (const failure of euroArea.failures) {
    failures.push(failure.code);
    console.error(`[Macro scheduler] ${failure.code}: ${failure.message}`);
  }

  console.log("[Macro scheduler] Refresh complete.");
  return { status: failures.length === 0 ? "synced" as const : "partial" as const, failures };
}

export const syncFredIfStale = syncMacroIfStale;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown sync error";
}
