import { PageHeader } from "@/components/ui/PageHeader";
import { PlannedList } from "@/components/ui/PlannedList";
import { SectionCard } from "@/components/ui/SectionCard";

export default function CentralBanksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Markets / Policy"
        title="Central banks"
        description="Keep policy stance, meetings and communication in one measured view."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Policy map" description="The current stance of the institutions followed by the desk." meta="Phase 2">
          <PlannedList items={["Policy rate and direction", "Latest decision", "Forward guidance"]} note="Coverage will begin with the central banks relevant to this desk." />
        </SectionCard>
        <SectionCard title="Meeting notes" description="A readable record of decisions and meaningful language shifts." meta="Phase 2">
          <PlannedList items={["Upcoming meetings", "Statement changes", "Desk interpretation"]} note="Primary-source links will remain attached to each note." />
        </SectionCard>
      </div>
    </>
  );
}
