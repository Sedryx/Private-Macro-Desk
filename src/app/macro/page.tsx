import { PageHeader } from "@/components/ui/PageHeader";
import { PlannedList } from "@/components/ui/PlannedList";
import { SectionCard } from "@/components/ui/SectionCard";

export default function MacroPage() {
  return (
    <>
      <PageHeader
        eyebrow="Markets / Economy"
        title="Macro backdrop"
        description="A focused view of the forces shaping growth, inflation and policy. This workspace arrives in Phase 2."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Economic pulse" description="The indicators that matter, without turning the desk into a data warehouse." meta="Phase 2">
          <PlannedList items={["Rates and inflation", "Labour and growth", "PMI and activity"]} note="Historical data will use free, documented sources." />
        </SectionCard>
        <SectionCard title="Regime notes" description="A concise written view of what is changing and why it matters." meta="Phase 2">
          <PlannedList items={["Growth direction", "Inflation pressure", "Policy impulse"]} note="No automated buy or sell signal will be generated here." />
        </SectionCard>
      </div>
    </>
  );
}
