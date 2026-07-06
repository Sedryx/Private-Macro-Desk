import { DeleteResearchDocumentButton } from "@/components/research/DeleteResearchDocumentButton";
import type { ResearchDocumentItem } from "@/components/research/ResearchDocumentList";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

const typeClasses = {
  PDF: "border-[#394858] bg-[#101923] text-[#a9c7e6]",
  FILING: "border-[#4b4330] bg-[#1d1810] text-[#dfc787]",
  NOTE: "border-[#31513a] bg-[#111d15] text-[#a8d3aa]",
  ARTICLE: "border-[#403752] bg-[#171421] text-[#c5b4e8]",
  OTHER: "border-[#363d3e] bg-[#121719] text-[#aab2ae]",
};

export function ResearchDocumentCard({ document }: { document: ResearchDocumentItem }) {
  const preview = document.chunks[0]?.content?.trim();

  return (
    <article className="px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${typeClasses[document.type]}`}>{document.type}</span>
            {document.source ? <span className="text-[10px] text-[#7f8984]">{document.source}</span> : null}
          </div>
          <h3 className="mt-2 break-words text-[15px] font-semibold tracking-[-0.02em] text-[#edf1ee]">{document.title}</h3>
          <p className="mt-1 text-[10px] text-[#66716b]">
            Added {dateFormatter.format(new Date(document.createdAt))} by {document.uploadedBy.name}
          </p>
          <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#8d9792]">
            {preview || "No content chunk yet. Metadata-only document."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {document.fileUrl ? (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white"
            >
              Source
            </a>
          ) : null}
          <DeleteResearchDocumentButton documentId={document.id} title={document.title} />
        </div>
      </div>

      <details className="group mt-4 rounded-lg border border-[var(--line)] bg-[#0f1519]">
        <summary className="cursor-pointer list-none px-4 py-3 text-[11px] font-medium text-[#aeb8b2] transition hover:text-white">
          <span className="inline group-open:hidden">View document</span>
          <span className="hidden group-open:inline">Hide document</span>
        </summary>
        <div className="border-t border-[var(--line)] px-4 py-4">
          <dl className="grid gap-3 text-[11px] sm:grid-cols-2">
            <Meta label="Type" value={document.type} />
            <Meta label="Uploaded by" value={`${document.uploadedBy.name} / ${document.uploadedBy.email}`} />
            <Meta label="Source" value={document.source ?? "Not set"} />
            <Meta label="Updated" value={dateFormatter.format(new Date(document.updatedAt))} />
          </dl>

          {document.fileUrl ? (
            <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-[11px] text-[#b8c0bc] underline-offset-4 hover:underline">
              Open file/source URL
            </a>
          ) : null}

          <div className="mt-5 space-y-3">
            <p className="terminal-label">Chunks / Content</p>
            {document.chunks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#30393e] px-4 py-6 text-center text-[12px] text-[#68736e]">
                No chunks saved for this document.
              </div>
            ) : (
              document.chunks.map((chunk, index) => (
                <div key={chunk.id} className="rounded-lg border border-[#263035] bg-[#0c1114] p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#68736e]">
                    Chunk {index + 1}{chunk.pageNumber ? ` / page ${chunk.pageNumber}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-[12px] leading-6 text-[#c2cbc6]">{chunk.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </details>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-[#65706b]">{label}</dt>
      <dd className="mt-1 break-words text-[#b8c0bc]">{value}</dd>
    </div>
  );
}

