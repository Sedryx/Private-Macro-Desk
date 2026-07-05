import { FRED_SERIES, syncFredSeries } from "@/lib/data/fred";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 30 * 1000;

type SchedulerState = {
  timer?: ReturnType<typeof setInterval>;
  initialCheck?: ReturnType<typeof setTimeout>;
  running?: Promise<unknown>;
};

const globalForFredScheduler = globalThis as typeof globalThis & {
  fredSchedulerState?: SchedulerState;
};

export function startFredScheduler() {
  const state =
    globalForFredScheduler.fredSchedulerState ??
    (globalForFredScheduler.fredSchedulerState = {});

  if (state.timer) return;

  const checkAndSync = () => {
    if (state.running) return;

    state.running = syncFredIfStale()
      .catch((error: unknown) => {
        console.error(
          "[FRED scheduler] Sync failed:",
          error instanceof Error ? error.message : error,
        );
      })
      .finally(() => {
        state.running = undefined;
      });
  };

  state.initialCheck = setTimeout(checkAndSync, INITIAL_CHECK_DELAY_MS);
  state.initialCheck.unref();
  state.timer = setInterval(checkAndSync, TWO_HOURS_MS);
  state.timer.unref();

  console.log("[FRED scheduler] Automatic sync enabled every 2 hours.");
}

export async function syncFredIfStale() {
  if (!process.env.FRED_API_KEY) {
    console.warn("[FRED scheduler] FRED_API_KEY is missing; automatic sync skipped.");
    return { status: "missing-key" as const };
  }

  const { prisma } = await import("@/lib/prisma");
  const existingIndicators = await prisma.macroIndicator.findMany({
    where: {
      code: { in: FRED_SERIES.map((series) => series.code) },
      source: { in: ["FRED", "FRED / calculated"] },
    },
    select: { code: true, updatedAt: true },
  });
  const oldestUpdate = existingIndicators.reduce<Date | null>(
    (oldest, indicator) =>
      oldest === null || indicator.updatedAt < oldest
        ? indicator.updatedAt
        : oldest,
    null,
  );
  const complete = existingIndicators.length === FRED_SERIES.length;
  const fresh =
    complete &&
    oldestUpdate !== null &&
    Date.now() - oldestUpdate.getTime() < TWO_HOURS_MS;

  if (fresh) {
    console.log("[FRED scheduler] Data is still fresh; sync skipped.");
    return { status: "fresh" as const };
  }

  console.log("[FRED scheduler] Refreshing FRED data...");

  for (const series of FRED_SERIES) {
    const result = await syncFredSeries(series);
    console.log(
      `[FRED scheduler] ${result.code}: ${result.valueCount} values updated.`,
    );
  }

  console.log("[FRED scheduler] Automatic refresh complete.");
  return { status: "synced" as const };
}
