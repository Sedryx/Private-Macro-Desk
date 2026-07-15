import { FOREX_FACTORY_PROVIDER } from "@/lib/data/forex-factory";

// Forex Factory's free "this week" export never carries an "actual" field at all (verified against
// the live feed — only title/country/date/impact/forecast/previous exist). For the handful of marquee
// US releases we already sync straight from FRED, we can cross-reference the real published value
// instead of leaving the Actual column permanently empty. Only mappings with a 1:1 release cadence
// between the calendar and the FRED series are included (e.g. GDP is deliberately excluded: it gets
// 2-3 Forex Factory releases per quarter — advance/second/third estimate — against a single FRED
// quarterly value, so rank-pairing them would misattribute figures to the wrong release).
type BackfillMapping = {
  indicatorCode: string;
  format: (value: number) => string;
  matchesTitle: (lowerTitle: string) => boolean;
};

export const percent1 = (value: number) => `${value.toFixed(1) === "-0.0" ? "0.0" : value.toFixed(1)}%`;
export const claimsK = (value: number) => `${Math.round(value / 1000)}K`;
export const jobsK = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value)}K`;
export const indexValue = (value: number) => value.toFixed(1);

const BACKFILL_MAPPINGS: BackfillMapping[] = [
  { indicatorCode: "US_CPI_YOY", format: percent1, matchesTitle: (title) => title === "cpi y/y" },
  { indicatorCode: "US_CORE_CPI_YOY", format: percent1, matchesTitle: (title) => title === "core cpi y/y" },
  { indicatorCode: "US_CPI_MOM", format: percent1, matchesTitle: (title) => title === "cpi m/m" },
  { indicatorCode: "US_CORE_CPI_MOM", format: percent1, matchesTitle: (title) => title === "core cpi m/m" },
  { indicatorCode: "US_PPI_MOM", format: percent1, matchesTitle: (title) => title === "ppi m/m" },
  { indicatorCode: "US_CORE_PPI_MOM", format: percent1, matchesTitle: (title) => title === "core ppi m/m" },
  { indicatorCode: "US_RETAIL_SALES_MOM", format: percent1, matchesTitle: (title) => title === "retail sales m/m" },
  { indicatorCode: "US_INITIAL_CLAIMS", format: claimsK, matchesTitle: (title) => title === "unemployment claims" },
  { indicatorCode: "US_UNEMPLOYMENT", format: percent1, matchesTitle: (title) => title === "unemployment rate" },
  { indicatorCode: "US_NFP_CHANGE", format: jobsK, matchesTitle: (title) => title === "non-farm employment change" },
  // Matches "UoM Consumer Sentiment", "Prelim UoM Consumer Sentiment" and "Revised UoM Consumer Sentiment" —
  // Forex Factory publishes three passes per month against the one FRED value available at each point in time.
  { indicatorCode: "US_CONSUMER_SENTIMENT", format: indexValue, matchesTitle: (title) => title.includes("uom consumer sentiment") },
];

export async function backfillCalendarActualsFromFred(): Promise<{ filled: number }> {
  const { prisma } = await import("@/lib/prisma");
  let filled = 0;

  const openEvents = await prisma.economicEvent.findMany({
    where: {
      provider: FOREX_FACTORY_PROVIDER,
      currency: "USD",
      actualValue: null,
      eventTime: { lt: new Date() },
    },
    orderBy: { eventTime: "asc" },
    select: { id: true, title: true },
  });
  if (openEvents.length === 0) return { filled: 0 };

  for (const mapping of BACKFILL_MAPPINGS) {
    const matchedEvents = openEvents.filter((event) => mapping.matchesTitle(event.title.trim().toLowerCase()));
    if (matchedEvents.length === 0) continue;

    const indicator = await prisma.macroIndicator.findUnique({
      where: { code: mapping.indicatorCode },
      include: { values: { orderBy: { date: "asc" } } },
    });
    const values = indicator?.values ?? [];
    if (values.length === 0) continue;

    // Both series share the same monthly/weekly cadence for these mappings, so pairing the most
    // recent N calendar releases with the most recent N FRED points (walking backwards from "now")
    // lines them up correctly without needing to model each series' exact publication lag.
    const count = Math.min(matchedEvents.length, values.length);
    for (let i = 0; i < count; i += 1) {
      const event = matchedEvents[matchedEvents.length - 1 - i];
      const value = values[values.length - 1 - i];
      await prisma.economicEvent.update({
        where: { id: event.id },
        data: { actualValue: mapping.format(value.value.toNumber()), actualSource: "FRED" },
      });
      filled += 1;
    }
  }

  return { filled };
}
