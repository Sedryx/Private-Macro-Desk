import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function JournalPage() {
  return <><PageHeader eyebrow="Review" title="Trading Journal" description="Document decisions, execution quality and lessons from completed trades." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Recent Entries" description="Trade records and review status will appear here." /><SectionCard title="Review Summary" description="Recurring errors and useful lessons will be gathered here." /></div></>;
}
