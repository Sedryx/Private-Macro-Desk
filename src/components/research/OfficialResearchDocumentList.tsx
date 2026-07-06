import { RemoveLocalResearchCopyButton } from "@/components/research/RemoveLocalResearchCopyButton";

export type OfficialResearchDocumentItem = {
  id: string;
  ticker: string | null;
  title: string;
  companyName: string | null;
  formType: string | null;
  filedAt: string | null;
  reportDate: string | null;
  provider: string | null;
  sourceUrl: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

export function OfficialResearchDocumentList({ documents }: { documents: OfficialResearchDocumentItem[] }) {
  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <div>
          <p className="terminal-label">Official documents</p>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Synced provider feed</h2>
        </div>
        <span className="rounded-md border border-[#343538] bg-[#101112] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#777779]">
          {documents.length} docs
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="px-5 py-20 text-center sm:px-6">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h3 className="mt-5 text-[14px] font-semibold text-[#d9ddda]">No official documents synced yet</h3>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#78827e]">
            Run <span className="font-mono text-[#b7c0bb]">npm run data:research</span> to sync SEC EDGAR filings.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-[12px]">
            <thead className="border-b border-[var(--line)] bg-[#0f1417] text-[9px] uppercase tracking-[0.14em] text-[#6d7772]">
              <tr>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">Title / Company</th>
                <th className="px-4 py-3 font-medium">Form</th>
                <th className="px-4 py-3 font-medium">Filed</th>
                <th className="px-4 py-3 font-medium">Report date</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {documents.map((document) => (
                <tr key={document.id} className="transition hover:bg-[#131a1d]">
                  <td className="px-4 py-4 align-top font-mono text-[12px] font-semibold text-[#e6eae7]">{document.ticker ?? "-"}</td>
                  <td className="max-w-[360px] px-4 py-4 align-top">
                    <p className="break-words text-[13px] font-semibold text-[#e4e9e6]">{document.companyName ?? document.title}</p>
                    <p className="mt-1 line-clamp-1 text-[10px] text-[#6f7a74]">{document.title}</p>
                  </td>
                  <td className="px-4 py-4 align-top"><FormBadge formType={document.formType} /></td>
                  <td className="px-4 py-4 align-top font-mono text-[#a6aea9]">{formatDate(document.filedAt)}</td>
                  <td className="px-4 py-4 align-top font-mono text-[#87918b]">{formatDate(document.reportDate)}</td>
                  <td className="px-4 py-4 align-top"><ProviderBadge provider={document.provider} /></td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      {document.sourceUrl ? (
                        <a
                          href={document.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="px-3 py-2 text-[11px] text-[#5f6965]">No link</span>
                      )}
                      <RemoveLocalResearchCopyButton documentId={document.id} title={document.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FormBadge({ formType }: { formType: string | null }) {
  return (
    <span className="rounded border border-[#4b4330] bg-[#1d1810] px-2 py-1 font-mono text-[10px] font-semibold text-[#dfc787]">
      {formType ?? "-"}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  return (
    <span className="rounded border border-[#34424a] bg-[#101820] px-2 py-1 text-[10px] font-semibold text-[#9fc0d8]">
      {provider ?? "Official"}
    </span>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "-";
}

