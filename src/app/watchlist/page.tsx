import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function WatchlistPage() {
  return <><PageHeader eyebrow="Markets" title="Watchlist" description="Keep the shared list of instruments, levels and market context organized." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Tracked Instruments" description="Assets and their key levels will be listed here." /><SectionCard title="Market Notes" description="Shared context and observations for the watchlist will appear here." /></div></>;
}
