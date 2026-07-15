"use client";

import { useMemo, useState } from "react";

import { RemoveLocalResearchCopyButton } from "@/components/research/RemoveLocalResearchCopyButton";

export type OfficialResearchDocumentItem = {
  id: string;
  title: string;
  kind: string | null;
  filedAt: string | null;
  provider: string | null;
  country: string | null;
  sourceUrl: string | null;
  summary: string | null;
  keyTakeaways: string[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Zurich",
});

const regions: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All regions" },
  { value: "US", label: "US · Fed" },
  { value: "EU", label: "EU · ECB" },
];

type SortOrder = "desc" | "asc";

export function OfficialResearchDocumentList({ documents }: { documents: OfficialResearchDocumentItem[] }) {
  const [region, setRegion] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter((document) => region === "ALL" || document.country === region);
    return [...filtered].sort((left, right) => {
      const leftTime = left.filedAt ? new Date(left.filedAt).getTime() : 0;
      const rightTime = right.filedAt ? new Date(right.filedAt).getTime() : 0;
      return sortOrder === "desc" ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [documents, region, sortOrder]);

  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <div>
          <p className="terminal-label">Official documents</p>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Central bank statements</h2>
        </div>
        <div className="flex items-center gap-2">
          <select value={region} onChange={(event) => setRegion(event.target.value)} className="desk-field px-3 py-2 text-[11px] sm:w-44">
            {regions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((order) => (order === "desc" ? "asc" : "desc"))}
            className="desk-button whitespace-nowrap px-2.5 py-2 text-[10px] font-semibold"
          >
            Date {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="px-5 py-20 text-center sm:px-6">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h3 className="mt-5 text-[14px] font-semibold text-[#d9ddda]">No official documents synced yet</h3>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#78827e]">
            Run <span className="font-mono text-[#b7c0bb]">npm run data:research</span> to sync Fed and ECB statements.
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="px-5 py-16 text-center text-[12px] text-[#78827e]">No documents for this region.</div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {filteredDocuments.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              expanded={expandedId === document.id}
              onToggle={() => setExpandedId((current) => (current === document.id ? null : document.id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DocumentRow({
  document,
  expanded,
  onToggle,
}: {
  document: OfficialResearchDocumentItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasTakeaways = document.keyTakeaways.length > 0;
  const [view, setView] = useState<"summary" | "takeaways">("summary");

  return (
    <div className="px-5 sm:px-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-2 py-4 text-left sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="shrink-0 font-mono text-[10px] text-[#6f7a74] sm:w-20">{formatDate(document.filedAt)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RegionTag country={document.country} />
            {document.kind ? <span className="terminal-label text-[8px] text-[#77817d]">{document.kind}</span> : null}
          </div>
          <p className="mt-1.5 text-[13px] font-semibold leading-5 text-[#e4e9e6]">{document.title}</p>
        </div>
        <span className={`shrink-0 text-[10px] text-[#6f7a74] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>

      {expanded ? (
        <div className="pb-4 sm:pl-24">
          {hasTakeaways ? (
            <div className="mb-2 flex items-center gap-1">
              <ToggleButton active={view === "summary"} onClick={() => setView("summary")}>Summary</ToggleButton>
              <ToggleButton active={view === "takeaways"} onClick={() => setView("takeaways")}>Key takeaways</ToggleButton>
            </div>
          ) : null}

          {view === "takeaways" && hasTakeaways ? (
            <ul className="list-disc space-y-1 pl-4 text-[12px] leading-5 text-[#8d9792]">
              {document.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          ) : document.summary ? (
            <p className="text-[12px] leading-5 text-[#8d9792]">{document.summary}</p>
          ) : (
            <p className="text-[12px] text-[#5f6965]">No summary available.</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            {document.sourceUrl ? (
              <a
                href={document.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-semibold text-[#9db89b] transition hover:text-white hover:underline"
              >
                View source document ↗
              </a>
            ) : (
              <span />
            )}
            <RemoveLocalResearchCopyButton documentId={document.id} title={document.title} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] transition ${
        active
          ? "border-[#3a4b41] bg-[#152019] text-[#a9dcb8]"
          : "border-[#2a2c2e] bg-transparent text-[#6f7a74] hover:text-[#9aa49f]"
      }`}
    >
      {children}
    </button>
  );
}

function RegionTag({ country }: { country: string | null }) {
  const label = country === "US" ? "US · Fed" : country === "EU" ? "EU · ECB" : country ?? "Official";
  return (
    <span className="rounded border border-[#343538] bg-[#101112] px-1.5 py-0.5 text-[9px] font-semibold text-[#9aa49f]">
      {label}
    </span>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "-";
}
