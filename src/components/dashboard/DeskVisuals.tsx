export type DistributionItem = {
  label: string;
  value: number;
  color: string;
};

export function DeskVisuals({
  tradeStatuses,
  watchlistBiases,
  openRiskTotal,
  largestOpenRisk,
  openTradeCount,
  sizedOpenTradeCount,
}: {
  tradeStatuses: DistributionItem[];
  watchlistBiases: DistributionItem[];
  openRiskTotal: number;
  largestOpenRisk: number;
  openTradeCount: number;
  sizedOpenTradeCount: number;
}) {
  return (
    <>
      <DistributionCard
        eyebrow="Journal"
        title="Trade Status Distribution"
        description="All trades currently recorded in the journal."
        items={tradeStatuses}
      />
      <DistributionCard
        eyebrow="Watchlist"
        title="Watchlist Bias Distribution"
        description="Current bias across the shared Main Watchlist."
        items={watchlistBiases}
      />
      <article className="desk-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Risk</p>
            <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Open Risk Snapshot</h3>
            <p className="mt-1 text-[11px] text-[#707b76]">Approximate sum of riskPercent on OPEN trades.</p>
          </div>
          <span className="text-[10px] text-[#626d68]">{openTradeCount} open</span>
        </div>

        {openTradeCount === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[#30393e] px-4 py-8 text-center text-[12px] text-[#68736e]">
            No open risk
          </div>
        ) : sizedOpenTradeCount === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[#30393e] px-4 py-8 text-center text-[12px] text-[#68736e]">
            Open trades have no riskPercent set
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              <RiskMetric label="Total open risk" value={`~${formatPercent(openRiskTotal)}%`} />
              <RiskMetric label="Largest open risk" value={`${formatPercent(largestOpenRisk)}%`} />
            </div>
            {sizedOpenTradeCount < openTradeCount ? (
              <p className="mt-2 text-[9px] text-[#5f6965]">{sizedOpenTradeCount} of {openTradeCount} open trades have risk defined.</p>
            ) : null}
          </div>
        )}
      </article>
    </>
  );
}

function DistributionCard({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: DistributionItem[];
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="desk-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">{eyebrow}</p>
          <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">{title}</h3>
          <p className="mt-1 text-[11px] text-[#707b76]">{description}</p>
        </div>
        <span className="text-[10px] text-[#626d68]">{total} total</span>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-3">
            <span className="text-[9px] font-medium text-[#7f8984]">{item.label}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#242c30]">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: item.value === 0 ? "0%" : `${Math.max((item.value / maximum) * 100, 8)}%` }}
              />
            </div>
            <span className="text-right text-[10px] font-semibold text-[#aab2ae]">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RiskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[#0f1519] p-4">
      <p className="text-[10px] text-[#65706b]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#dce2de]">{value}</p>
    </div>
  );
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}
