const axes = [
  { label: "Risk sentiment", value: "Not connected yet" },
  { label: "Rates pressure", value: "Pending macro data" },
  { label: "USD pressure", value: "Pending macro data" },
  { label: "Volatility", value: "Pending macro data" },
];

export function MarketRegimeCard() {
  return (
    <article className="desk-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Market Regime</p>
          <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Macro visual placeholder</h3>
        </div>
        <span className="rounded-full border border-[#3b4037] bg-[#171b16] px-2.5 py-1 text-[9px] text-[#899481]">Phase 2</span>
      </div>

      <div className="mt-5 space-y-4">
        {axes.map((axis) => (
          <div key={axis.label}>
            <div className="flex items-center justify-between gap-4 text-[10px]">
              <span className="text-[#919b96]">{axis.label}</span>
              <span className="text-[#606b66]">{axis.value}</span>
            </div>
            <div className="relative mt-2 h-1 rounded-full bg-[#242c30]">
              <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#59645d] bg-[#171d20]" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-[var(--line)] pt-4 text-[10px] leading-4 text-[#5f6965]">
        These axes will use real macro inputs later. No regime is inferred today.
      </p>
    </article>
  );
}
