import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import {
  fetchForexFactoryCalendar,
  FOREX_FACTORY_PROVIDER,
  type ForexFactoryEvent,
} from "../src/lib/data/forex-factory";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const { events, ignored } = await fetchForexFactoryCalendar();
  const externalIds = events.map((event) => event.externalId);
  const existing = await prisma.economicEvent.findMany({
    where: {
      provider: FOREX_FACTORY_PROVIDER,
      externalId: { in: externalIds },
    },
    select: {
      externalId: true,
      title: true,
      country: true,
      currency: true,
      eventTime: true,
      importance: true,
      previousValue: true,
      forecastValue: true,
      actualValue: true,
      source: true,
    },
  });
  const existingById = new Map(existing.map((event) => [event.externalId, event]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const current = existingById.get(event.externalId);
    if (current && isUnchanged(current, event)) {
      skipped += 1;
      continue;
    }

    await prisma.economicEvent.upsert({
      where: {
        provider_externalId: {
          provider: FOREX_FACTORY_PROVIDER,
          externalId: event.externalId,
        },
      },
      update: event,
      create: event,
    });
    if (current) updated += 1;
    else created += 1;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const deleted = await prisma.economicEvent.deleteMany({
    where: {
      provider: FOREX_FACTORY_PROVIDER,
      eventTime: { lt: cutoff },
    },
  });

  console.log(
    `Forex Factory calendar: ${created} created, ${updated} updated, ${skipped} skipped, ${deleted.count} deleted, ${ignored} invalid ignored.`,
  );
}

function isUnchanged(
  current: {
    title: string;
    country: string | null;
    currency: string | null;
    eventTime: Date;
    importance: ForexFactoryEvent["importance"];
    previousValue: string | null;
    forecastValue: string | null;
    actualValue: string | null;
    source: string | null;
  },
  event: ForexFactoryEvent,
) {
  return current.title === event.title &&
    current.country === event.country &&
    current.currency === event.currency &&
    current.eventTime.getTime() === event.eventTime.getTime() &&
    current.importance === event.importance &&
    current.previousValue === event.previousValue &&
    current.forecastValue === event.forecastValue &&
    current.actualValue === event.actualValue &&
    current.source === event.source;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Calendar sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
