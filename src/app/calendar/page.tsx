import { EconomicCalendarTable } from "@/components/calendar/EconomicCalendarTable";
import type { EconomicEventView } from "@/components/calendar/types";
import { FOREX_FACTORY_PROVIDER } from "@/lib/data/forex-factory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<{ events: EconomicEventView[]; databaseError: boolean }> {
  try {
    const events = await prisma.economicEvent.findMany({
      where: { provider: FOREX_FACTORY_PROVIDER },
      orderBy: [{ eventTime: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        country: true,
        currency: true,
        provider: true,
        importance: true,
        eventTime: true,
        previousValue: true,
        forecastValue: true,
        actualValue: true,
        expectedImpact: true,
        source: true,
      },
    });
    return {
      databaseError: false,
      events: events.map((event) => ({
        ...event,
        impact: event.title.toLowerCase().includes("holiday") ? "HOLIDAY" : event.importance,
        eventTime: event.eventTime.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Unable to load Forex Factory events", error);
    return { events: [], databaseError: true };
  }
}

export default async function CalendarPage() {
  const { events, databaseError } = await getEvents();
  return (
    <>
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[#f0f2ef] sm:text-[34px]">
          Economic calendar
        </h1>
      </header>
      {databaseError ? (
        <EmptyState text="Calendar unavailable. Check PostgreSQL and DATABASE_URL." />
      ) : events.length === 0 ? (
        <EmptyState text="Run npm run data:calendar" />
      ) : (
        <EconomicCalendarTable events={events} />
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return <section className="desk-surface px-6 py-16 text-center text-[12px] text-[#78827e]">{text}</section>;
}
