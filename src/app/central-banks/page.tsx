import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function CentralBanksPage() {
  return <><PageHeader eyebrow="Policy" title="Central Banks" description="Follow policy decisions, guidance and the direction of major central banks." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Policy Overview" description="Current rates and policy stance by institution will appear here." /><SectionCard title="Meeting Tracker" description="Upcoming decisions and recent communication will be summarized here." /></div></>;
}
