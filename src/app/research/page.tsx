import { PageHeader } from "@/components/ui/PageHeader";
import { PlannedList } from "@/components/ui/PlannedList";
import { SectionCard } from "@/components/ui/SectionCard";

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace / Documents"
        title="Research library"
        description="A private home for documents, source-backed notes and careful research."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Document library" description="Keep filings, PDFs and working notes organised." meta="Phase 4">
          <PlannedList items={["PDFs and filings", "Source metadata", "Document status"]} note="Storage and document handling will be designed before ingestion begins." />
        </SectionCard>
        <SectionCard title="Research notes" description="Summaries should remain traceable to their source." meta="Phase 4">
          <PlannedList items={["Cited excerpts", "Desk summaries", "Open research questions"]} note="AI assistance will support research, never issue buy or sell calls." />
        </SectionCard>
      </div>
    </>
  );
}
