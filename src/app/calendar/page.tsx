import { PageHeader } from "@/components/ui/PageHeader";
import { PlannedList } from "@/components/ui/PlannedList";
import { SectionCard } from "@/components/ui/SectionCard";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Markets / Events"
        title="Economic calendar"
        description="Prepare for scheduled risk before the session begins. No invented events or live feed are shown yet."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Upcoming releases" description="A calm timeline of relevant economic events." meta="Phase 2">
          <PlannedList items={["Release time and country", "Expected importance", "Previous, forecast and actual"]} note="The source and refresh policy will be explicit." />
        </SectionCard>
        <SectionCard title="Event preparation" description="Room for expectations and post-release observations." meta="Phase 2">
          <PlannedList items={["What the market expects", "Scenarios worth watching", "What changed after release"]} note="This remains research context, not a trading signal." />
        </SectionCard>
      </div>
    </>
  );
}
