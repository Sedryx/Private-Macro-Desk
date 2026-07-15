import { generateStructuredJson } from "@/lib/ai/gemini";

const ZURICH_TIME_ZONE = "Europe/Zurich";
const MODEL_LABEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_STATEMENT_CHARS = 12_000;
const MAX_EVENTS = 25;

export type DriverPayload = {
  label: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  weight: number;
  reasoning: string;
};

export type ScenarioPayload = { probability: number; headline: string; detail: string };

export type DailyBriefPayload = {
  recap: string;
  drivers: DriverPayload[];
  scenarios: { base: ScenarioPayload; bull: ScenarioPayload; bear: ScenarioPayload };
  riskSentimentScore: number;
};

export type DailyMacroBriefView = DailyBriefPayload & { generatedAt: string };

type RawBriefPayload = {
  recap?: unknown;
  drivers?: unknown;
  scenarios?: unknown;
  riskSentimentScore?: unknown;
};

export async function generateDailyBriefIfStale(force = false) {
  const { prisma } = await import("@/lib/prisma");
  const dateKey = zurichDateKey(new Date());
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  if (!force) {
    const existing = await prisma.dailyMacroBrief.findUnique({ where: { date }, select: { id: true } });
    if (existing) return { status: "fresh" as const };
  }

  const context = await buildDailyBriefContext();
  const payload = await generateDailyBrief(context);
  if (!payload) return { status: "failed" as const };

  await prisma.dailyMacroBrief.upsert({
    where: { date },
    create: {
      date,
      recap: payload.recap,
      drivers: payload.drivers,
      scenarios: payload.scenarios,
      riskSentimentScore: payload.riskSentimentScore,
      sourceDocumentIds: context.sourceDocumentIds,
      sourceEventCount: context.events.length,
      model: MODEL_LABEL,
    },
    update: {
      recap: payload.recap,
      drivers: payload.drivers,
      scenarios: payload.scenarios,
      riskSentimentScore: payload.riskSentimentScore,
      sourceDocumentIds: context.sourceDocumentIds,
      sourceEventCount: context.events.length,
      model: MODEL_LABEL,
      generatedAt: new Date(),
    },
  });

  return { status: "synced" as const };
}

export async function getLatestDailyBrief(): Promise<DailyMacroBriefView | null> {
  const { prisma } = await import("@/lib/prisma");
  const brief = await prisma.dailyMacroBrief.findFirst({ orderBy: { date: "desc" } });
  if (!brief) return null;

  return {
    recap: brief.recap,
    drivers: brief.drivers as unknown as DriverPayload[],
    scenarios: brief.scenarios as unknown as DailyBriefPayload["scenarios"],
    riskSentimentScore: brief.riskSentimentScore,
    generatedAt: brief.generatedAt.toISOString(),
  };
}

async function buildDailyBriefContext() {
  const { prisma } = await import("@/lib/prisma");

  const [fedDoc, ecbDoc] = await Promise.all([
    prisma.researchDocument.findFirst({
      where: { provider: "Fed" },
      orderBy: { filedAt: "desc" },
      select: { id: true, title: true, chunks: { select: { content: true }, take: 1 } },
    }),
    prisma.researchDocument.findFirst({
      where: { provider: "ECB" },
      orderBy: { filedAt: "desc" },
      select: { id: true, title: true, chunks: { select: { content: true }, take: 1 } },
    }),
  ]);

  const bounds = thisWeekBounds();
  const events = await prisma.economicEvent.findMany({
    where: {
      eventTime: { gte: bounds.start, lte: bounds.end },
      importance: { in: ["HIGH", "MEDIUM"] },
    },
    orderBy: { eventTime: "asc" },
    take: MAX_EVENTS,
    select: {
      title: true,
      currency: true,
      actualValue: true,
      forecastValue: true,
      previousValue: true,
      eventTime: true,
    },
  });

  const sourceDocumentIds = [fedDoc?.id, ecbDoc?.id].filter((id): id is string => Boolean(id));

  return { fedDoc, ecbDoc, events, sourceDocumentIds };
}

async function generateDailyBrief(
  context: Awaited<ReturnType<typeof buildDailyBriefContext>>,
): Promise<DailyBriefPayload | null> {
  const fedText = context.fedDoc?.chunks[0]?.content?.slice(0, MAX_STATEMENT_CHARS);
  const ecbText = context.ecbDoc?.chunks[0]?.content?.slice(0, MAX_STATEMENT_CHARS);

  const eventLines = context.events
    .map((event) => {
      const day = event.eventTime.toISOString().slice(0, 10);
      return `- ${day} ${event.currency ?? ""} ${event.title}: actual=${event.actualValue ?? "-"} forecast=${event.forecastValue ?? "-"} previous=${event.previousValue ?? "-"}`;
    })
    .join("\n");

  const prompt = [
    context.fedDoc ? `Latest Fed statement (${context.fedDoc.title}):\n${fedText}` : "No recent Fed statement available.",
    context.ecbDoc ? `Latest ECB statement (${context.ecbDoc.title}):\n${ecbText}` : "No recent ECB statement available.",
    `This week's economic calendar (high/medium impact):\n${eventLines || "No events found."}`,
  ].join("\n\n---\n\n");

  const payload = await generateStructuredJson<RawBriefPayload>({
    systemInstruction:
      "You are a macro analyst writing a daily briefing for a private two-trader desk. " +
      "Base your analysis ONLY on the real source material provided (central bank statement excerpts and this week's economic calendar). " +
      "Never invent figures or events not present in the source. " +
      "Produce: a short recap paragraph (3-5 sentences) of what is moving markets and what to watch; " +
      "2 to 3 macro drivers, each with a label, a direction (BULLISH, BEARISH, or NEUTRAL for risk assets), a weight from 0 to 100 " +
      "representing relative importance, and a one-sentence reasoning; a base/bull/bear scenario breakdown where each has a " +
      "probability (the three must sum to 100), a short headline, and a one-sentence detail; and a riskSentimentScore integer " +
      "from 0 (risk-off) to 100 (risk-on). " +
      'Return ONLY JSON matching {"recap": string, "drivers": [{"label": string, "direction": string, "weight": number, ' +
      '"reasoning": string}], "scenarios": {"base": {"probability": number, "headline": string, "detail": string}, ' +
      '"bull": {...}, "bear": {...}}, "riskSentimentScore": number}.',
    prompt,
  });

  return isValidDailyBriefPayload(payload) ? payload : null;
}

function isValidDailyBriefPayload(payload: RawBriefPayload | null): payload is DailyBriefPayload {
  if (!payload) return false;
  if (typeof payload.recap !== "string" || payload.recap.trim().length === 0) return false;
  if (!Array.isArray(payload.drivers) || payload.drivers.length < 2 || payload.drivers.length > 3) return false;
  if (!payload.drivers.every(isValidDriver)) return false;

  const scenarios = payload.scenarios as Partial<Record<"base" | "bull" | "bear", unknown>> | undefined;
  if (!scenarios || !isValidScenario(scenarios.base) || !isValidScenario(scenarios.bull) || !isValidScenario(scenarios.bear)) {
    return false;
  }

  if (typeof payload.riskSentimentScore !== "number" || !Number.isFinite(payload.riskSentimentScore)) return false;
  if (payload.riskSentimentScore < 0 || payload.riskSentimentScore > 100) return false;

  return true;
}

function isValidDriver(value: unknown): value is DriverPayload {
  if (!value || typeof value !== "object") return false;
  const driver = value as Record<string, unknown>;
  return typeof driver.label === "string" &&
    (driver.direction === "BULLISH" || driver.direction === "BEARISH" || driver.direction === "NEUTRAL") &&
    typeof driver.weight === "number" &&
    typeof driver.reasoning === "string";
}

function isValidScenario(value: unknown): value is ScenarioPayload {
  if (!value || typeof value !== "object") return false;
  const scenario = value as Record<string, unknown>;
  return typeof scenario.probability === "number" &&
    typeof scenario.headline === "string" &&
    typeof scenario.detail === "string";
}

function zurichDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: ZURICH_TIME_ZONE }).format(date);
}

function thisWeekBounds() {
  const todayKey = zurichDateKey(new Date());
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const day = today.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}
