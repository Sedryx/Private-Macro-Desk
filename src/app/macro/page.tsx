import { MacroIndicatorGrid } from "@/components/macro/MacroIndicatorGrid";
import type { MacroIndicatorView } from "@/components/macro/MacroIndicatorCard";
import { MacroSummaryCards } from "@/components/macro/MacroSummaryCards";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const indicatorOrder = [
  "FEDFUNDS",
  "US_CPI",
  "US_UNEMPLOYMENT",
  "ECB_DEPOSIT_RATE",
  "SNB_POLICY_RATE",
];

async function getMacroIndicators() {
  try {
    const indicators = await prisma.macroIndicator.findMany({
      where: { code: { in: indicatorOrder } },
      include: {
        values: { orderBy: { date: "asc" } },
      },
    });

    const views: MacroIndicatorView[] = indicators
      .map((indicator) => {
        const values = indicator.values.map((point) => ({
          date: point.date.toISOString(),
          value: point.value.toNumber(),
        }));
        const latest = values.at(-1)?.value ?? null;
        const previous = values.at(-2)?.value ?? null;
        const numericValues = values.map((point) => point.value);

        return {
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          country: indicator.country,
          category: indicator.category,
          unit: indicator.unit,
          source: indicator.source,
          latest,
          change: latest !== null && previous !== null ? latest - previous : null,
          minimum: numericValues.length > 0 ? Math.min(...numericValues) : null,
          maximum: numericValues.length > 0 ? Math.max(...numericValues) : null,
          pointCount: numericValues.length,
          values,
        };
      })
      .sort((a, b) => indicatorOrder.indexOf(a.code) - indicatorOrder.indexOf(b.code));

    return { indicators: views, databaseError: false };
  } catch (error) {
    console.error("Unable to load macro indicators", error);
    return { indicators: [], databaseError: true };
  }
}

export default async function MacroPage() {
  const { indicators, databaseError } = await getMacroIndicators();

  return (
    <>
      <PageHeader
        eyebrow="Markets / Economy"
        title="Macro overview"
        description="A first visual layer for rates, inflation, labour and central-bank policy. Every value on this page is seeded demo data."
      />

      {databaseError ? (
        <MacroMessage
          title="Macro data unavailable"
          message="The desk cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page."
        />
      ) : indicators.length === 0 ? (
        <MacroIndicatorGrid indicators={[]} />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-3 rounded-xl border border-[#4a4132] bg-[#17150f] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#c2aa7d]">Demo data — real APIs will be connected later</p>
              <p className="mt-1 text-[10px] text-[#756b58]">These series are deterministic UI fixtures, not current economic releases.</p>
            </div>
            <span className="w-fit rounded-full border border-[#4a4132] px-2.5 py-1 text-[9px] font-medium text-[#9e8d6e]">90 seeded values</span>
          </div>

          <MacroSummaryCards indicators={indicators} />

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Historical view</p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#e6eae7]">Macro indicators</h2>
              </div>
              <p className="hidden text-[10px] text-[#626d68] sm:block">18 monthly demo points per series</p>
            </div>
            <MacroIndicatorGrid indicators={indicators} />
          </section>
        </div>
      )}
    </>
  );
}

function MacroMessage({ title, message }: { title: string; message: string }) {
  return (
    <section className="desk-surface px-6 py-16 text-center">
      <span className="mx-auto block h-px w-8 bg-[#56615b]" />
      <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">{message}</p>
    </section>
  );
}
