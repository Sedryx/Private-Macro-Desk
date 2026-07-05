import { MacroIndicatorCard, type MacroIndicatorView } from "@/components/macro/MacroIndicatorCard";

export function MacroIndicatorGrid({ indicators }: { indicators: MacroIndicatorView[] }) {
  if (indicators.length === 0) {
    return (
      <section className="desk-surface px-6 py-16 text-center">
        <span className="mx-auto block h-px w-8 bg-[#56615b]" />
        <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">No macro indicators found</h2>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">Run the database seed to create the five demo indicators and their historical values.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {indicators.map((indicator) => (
        <MacroIndicatorCard key={indicator.id} indicator={indicator} />
      ))}
    </section>
  );
}
