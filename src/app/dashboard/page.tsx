import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview / Static preview"
        title="Dashboard"
        description="A compact view of the trading day. All values below are placeholders for the initial interface."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Market Regime" value="Risk neutral" detail="Placeholder assessment" />
        <StatCard label="Macro Events" value="3 today" detail="Static calendar preview" tone="negative" />
        <StatCard label="Watchlist" value="8 assets" detail="No live market data" tone="positive" />
        <StatCard label="Checklist" value="2 / 5" detail="Example workflow state" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Today’s Macro Events" description="Future economic calendar and impact tracking.">
          <div className="space-y-3 font-mono text-xs text-slate-400">
            <div className="flex justify-between border-b border-slate-800 pb-3"><span>08:30 · CPI release</span><span className="text-rose-300">HIGH</span></div>
            <div className="flex justify-between border-b border-slate-800 pb-3"><span>14:00 · Central bank speech</span><span className="text-amber-300">MED</span></div>
            <div className="flex justify-between"><span>16:30 · Inventories</span><span className="text-slate-500">LOW</span></div>
          </div>
        </SectionCard>

        <SectionCard title="Trading Checklist" description="Future pre-trade validation workflow.">
          <ul className="space-y-3 text-sm text-slate-400">
            <li>□ Macro bias reviewed</li>
            <li>□ Key levels mapped</li>
            <li>□ Risk defined</li>
            <li>□ Entry thesis written</li>
          </ul>
        </SectionCard>

        <SectionCard title="Watchlist Snapshot" description="Future instruments and context monitoring.">
          <p className="text-sm leading-6 text-slate-500">EUR/USD, S&amp;P 500, Gold and US 10Y will appear here once market data is introduced.</p>
        </SectionCard>

        <SectionCard title="Latest Notes" description="Future journal and research excerpts.">
          <p className="text-sm italic leading-6 text-slate-500">“No notes yet — this is a static interface placeholder.”</p>
        </SectionCard>
      </div>
    </>
  );
}
