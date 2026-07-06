import { ResearchDocumentCard } from "@/components/research/ResearchDocumentCard";

export type ResearchDocumentItem = {
  id: string;
  title: string;
  type: "PDF" | "FILING" | "NOTE" | "ARTICLE" | "OTHER";
  source: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  chunks: Array<{
    id: string;
    content: string;
    pageNumber: number | null;
    createdAt: string;
  }>;
};

export function ResearchDocumentList({ documents }: { documents: ResearchDocumentItem[] }) {
  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <div>
          <p className="terminal-label">Library / Documents</p>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Document list</h2>
        </div>
        <span className="rounded-md border border-[#343538] bg-[#101112] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#777779]">
          {documents.length} docs
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="px-5 py-16 text-center sm:px-6">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h3 className="mt-5 text-[14px] font-semibold text-[#d9ddda]">No research documents yet</h3>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#78827e]">
            Add a note, article, filing or PDF reference from the form. Content will be saved as a simple chunk.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {documents.map((document) => (
            <ResearchDocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </section>
  );
}

