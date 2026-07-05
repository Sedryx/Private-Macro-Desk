import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function CalendarPage() {
  return <><PageHeader eyebrow="Events" title="Economic Calendar" description="Prepare for scheduled releases and important market events." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Upcoming Events" description="Scheduled releases, times and expected impact will appear here." /><SectionCard title="Event Detail" description="Consensus, previous values and post-release notes will appear here." /></div></>;
}
