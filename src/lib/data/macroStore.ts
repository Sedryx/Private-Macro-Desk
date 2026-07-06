import type { MacroCategory } from "@prisma/client";

export type MacroObservation = {
  date: Date;
  value: number;
  flag?: string;
};

export async function replaceMacroSeries(input: {
  code: string;
  name: string;
  category: MacroCategory;
  country: string;
  unit: string;
  source: string;
  releaseType?: string | null;
  providerUpdatedAt?: Date | null;
  observations: MacroObservation[];
}) {
  if (input.observations.length === 0) {
    throw new Error(`${input.source} returned no usable values for ${input.code}.`);
  }

  const { prisma } = await import("@/lib/prisma");
  const observations = [...input.observations].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );

  return prisma.$transaction(async (transaction) => {
    const indicator = await transaction.macroIndicator.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        category: input.category,
        country: input.country,
        unit: input.unit,
        source: input.source,
        releaseType: input.releaseType ?? null,
        providerUpdatedAt: input.providerUpdatedAt ?? null,
      },
      create: {
        code: input.code,
        name: input.name,
        category: input.category,
        country: input.country,
        unit: input.unit,
        source: input.source,
        releaseType: input.releaseType ?? null,
        providerUpdatedAt: input.providerUpdatedAt ?? null,
      },
    });

    await transaction.macroValue.deleteMany({
      where: { indicatorId: indicator.id },
    });
    await transaction.macroValue.createMany({
      data: observations.map((observation) => ({
        indicatorId: indicator.id,
        date: observation.date,
        value: Number(observation.value.toFixed(4)),
      })),
    });

    return {
      code: input.code,
      source: input.source,
      valueCount: observations.length,
      latestDate: observations.at(-1)?.date,
    };
  });
}
