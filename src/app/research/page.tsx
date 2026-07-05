import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function ResearchPage() {
  return <><PageHeader eyebrow="Documents" title="Research" description="Organize private macro research and source-backed document notes." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Research Library" description="Documents and PDFs will be organized here in a later phase." /><SectionCard title="Research Notes" description="Source-linked summaries and notes will appear here without trading signals." /></div></>;
}
