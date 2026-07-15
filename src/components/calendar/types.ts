import type { EventImportance } from "@prisma/client";

export type EconomicEventView = {
  id: string;
  title: string;
  country: string | null;
  currency: string | null;
  provider: string | null;
  importance: EventImportance;
  impact: EventImportance | "HOLIDAY";
  eventTime: string;
  previousValue: string | null;
  forecastValue: string | null;
  actualValue: string | null;
  actualSource: string | null;
  expectedImpact: string | null;
  source: string | null;
  history: number[];
};

export type PricePoint = { date: string; value: number };
export type EventPriceSeries = { pairLabel: string; points: PricePoint[] };
