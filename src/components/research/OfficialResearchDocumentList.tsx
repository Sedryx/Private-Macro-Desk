"use client";

import { useMemo, useState } from "react";

import { RemoveLocalResearchCopyButton } from "@/components/research/RemoveLocalResearchCopyButton";

type SecExhibit = {
  exhibit: string;
  label: string;
  url: string;
};

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
  secItems: string[];
  exhibits: SecExhibit[];
  importance: string | null;
  category: string | null;
  summary: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

const formTypes = ["10-K", "10-Q", "8-K", "DEF 14A"];
const quickChips = [
  { label: "Earnings", category: "Earnings" },
  { label: "Annual reports", category: "Annual reports" },
  { label: "Quarterly reports", category: "Quarterly reports" },
  { label: "Material events", category: "Material events" },
];

export function OfficialResearchDocumentList({ documents }: { documents: OfficialResearchDocumentItem[] }) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const [ticker, setTicker] = useState("ALL");
  const [formType, setFormType] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const tickers = useMemo(
    () => [...new Set(documents.map((document) => document.ticker).filter((value): value is string => Boolean(value)))].sort(),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const startDate = getRangeStart(dateRange);

    return documents.filter((document) => {
      if (ticker !== "ALL" && document.ticker !== ticker) return false;
      if (formType !== "ALL" && document.formType !== formType) return false;
      if (category !== "ALL" && document.category !== category) return false;
      if (startDate && (!document.filedAt || new Date(document.filedAt) < startDate)) return false;

      if (normalizedSearch) {
        const haystack = `${document.companyName ?? ""} ${document.title} ${document.ticker ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [category, dateRange, documents, formType, search, ticker]);

  const selectedDocument = filteredDocuments.find((document) => document.id === selectedId) ?? filteredDocuments[0] ?? documents[0] ?? null;

  function selectChip(nextCategory: string) {
    setCategory((current) => current === nextCategory ? "ALL" : nextCategory);
  }

  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <div>
          <p className="terminal-label">Official documents</p>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">SEC EDGAR research workspace</h2>
        </div>
        <span className="rounded-md border border-[#343538] bg-[#101112] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#777779]">
          {filteredDocuments.length}/{documents.length} docs
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
        <div className="grid min-h-[680px] xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="border-b border-[var(--line)] xl:border-r xl:border-b-0">
            <div className="space-y-3 border-b border-[var(--line)] p-4">
              <div className="grid grid-cols-2 gap-2">
                <select value={ticker} onChange={(event) => setTicker(event.target.value)} className="desk-field px-2.5 py-2 text-[11px]">
                  <option value="ALL">All tickers</option>
                  {tickers.map((tickerOption) => <option key={tickerOption} value={tickerOption}>{tickerOption}</option>)}
                </select>
                <select value={formType} onChange={(event) => setFormType(event.target.value)} className="desk-field px-2.5 py-2 text-[11px]">
                  <option value="ALL">All forms</option>
                  {formTypes.map((form) => <option key={form} value={form}>{form}</option>)}
                </select>
                <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="desk-field px-2.5 py-2 text-[11px]">
                  <option value="ALL">All dates</option>
                  <option value="30D">Last 30 days</option>
                  <option value="90D">Last 90 days</option>
                  <option value="1Y">Last year</option>
                </select>
                <button
                  type="button"
                  onClick={() => { setTicker("ALL"); setFormType("ALL"); setDateRange("ALL"); setSearch(""); setCategory("ALL"); }}
                  className="rounded-md border border-[#30393e] bg-[#11181c] px-2.5 py-2 text-[10px] text-[#9aa49f] transition hover:border-[#4a5650] hover:text-white"
                >
                  Reset
                </button>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, title or ticker..."
                className="desk-field px-3 py-2.5 text-[12px]"
              />
              <div className="flex flex-wrap gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.category}
                    type="button"
                    onClick={() => selectChip(chip.category)}
                    className={
                      "rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition " +
                      (category === chip.category
                        ? "border-[#7a8067] bg-[#ecefdd] text-[#11140f]"
                        : "border-[#30393e] bg-[#11181c] text-[#9aa49f] hover:border-[#4a5650] hover:text-white")
                    }
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-[#78827e]">No documents match these filters.</div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                {filteredDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    active={selectedDocument?.id === document.id}
                    onSelect={() => setSelectedId(document.id)}
                  />
                ))}
              </div>
            )}
          </aside>

          <div className="min-w-0 p-4 sm:p-5">
            {selectedDocument ? <DocumentDetail document={selectedDocument} /> : <DetailEmptyState />}
          </div>
        </div>
      )}
    </section>
  );
}

function DocumentCard({ document, active, onSelect }: { document: OfficialResearchDocumentItem; active: boolean; onSelect: () => void }) {
  const labels = getDocumentLabels(document);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "block w-full border-b border-[var(--line)] px-4 py-4 text-left transition " +
        (active ? "bg-[#151c1f]" : "hover:bg-[#11171a]")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#e6eae7]">{document.ticker ?? "-"}</span>
            <FormBadge formType={document.formType} />
            <ImportanceBadge importance={labels.importance} />
          </div>
          <h3 className="mt-2 line-clamp-2 text-[13px] font-semibold leading-5 text-[#e4e9e6]">
            {document.companyName ?? document.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-[#6f7a74]">{formatDate(document.filedAt)}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[#8d9792]">{labels.summary}</p>
      {document.exhibits.length > 0 ? (
        <p className="mt-2 text-[10px] text-[#77817d]">{document.exhibits.length} exhibit{document.exhibits.length > 1 ? "s" : ""} detected</p>
      ) : null}
    </button>
  );
}

function DocumentDetail({ document }: { document: OfficialResearchDocumentItem }) {
  const labels = getDocumentLabels(document);

  return (
    <article className="h-full rounded-xl border border-[var(--line)] bg-[#0f1518]">
      <div className="border-b border-[var(--line)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="terminal-label">Selected filing</p>
            <h2 className="mt-3 max-w-3xl break-words text-[22px] font-semibold tracking-[-0.04em] text-[#f0f3f1]">
              {document.companyName ?? document.title}
            </h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#aab3ae]">{labels.summary}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {document.sourceUrl ? (
              <a href={document.sourceUrl} target="_blank" rel="noreferrer" className="desk-button px-3 py-2 text-[11px] font-semibold">
                Open SEC source
              </a>
            ) : null}
            <RemoveLocalResearchCopyButton documentId={document.id} title={document.title} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Company" value={document.companyName ?? "-"} />
            <Meta label="Ticker" value={document.ticker ?? "-"} />
            <Meta label="Form" value={document.formType ?? "-"} />
            <Meta label="Filed" value={formatDate(document.filedAt)} />
            <Meta label="Report date" value={formatDate(document.reportDate)} />
            <Meta label="Provider" value={document.provider ?? "Official"} />
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[#0b1012] p-4">
            <p className="terminal-label">What this means</p>
            <p className="mt-3 text-[12px] leading-6 text-[#b9c3bd]">{labels.explanation}</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-[var(--line)] bg-[#0b1012] p-4">
            <p className="terminal-label">SEC items</p>
            {document.secItems.length === 0 ? (
              <p className="mt-3 text-[12px] text-[#737d78]">No SEC item parsed for this filing.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {document.secItems.map((item) => (
                  <span key={item} className="rounded border border-[#394858] bg-[#101923] px-2 py-1 font-mono text-[10px] text-[#a9c7e6]">
                    Item {item} / {describeItem(item)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[#0b1012] p-4">
            <p className="terminal-label">Exhibits</p>
            {document.exhibits.length === 0 ? (
              <p className="mt-3 text-[12px] text-[#737d78]">No Exhibit 99.x attachment detected yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {document.exhibits.map((exhibit) => (
                  <a
                    key={`${exhibit.exhibit}-${exhibit.url}`}
                    href={exhibit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] transition hover:border-[#4a5650] hover:text-white"
                  >
                    <span className="font-mono text-[#dce2de]">Exhibit {exhibit.exhibit}</span>
                    <span className="text-[#8d9792]">{exhibit.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

function DetailEmptyState() {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#30393e] p-8 text-center text-[12px] text-[#78827e]">
      Select a filing to inspect SEC items, exhibits and source links.
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[#0b1012] p-3">
      <dt className="text-[9px] uppercase tracking-[0.14em] text-[#65706b]">{label}</dt>
      <dd className="mt-2 break-words text-[12px] font-medium text-[#dce2de]">{value}</dd>
    </div>
  );
}

function FormBadge({ formType }: { formType: string | null }) {
  return <span className="rounded border border-[#4b4330] bg-[#1d1810] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#dfc787]">{formType ?? "-"}</span>;
}

function ImportanceBadge({ importance }: { importance: string }) {
  const classes = importance === "High"
    ? "border-[#5f2b2b] bg-[#251313] text-[#ff8b8b]"
    : importance === "Governance"
      ? "border-[#403752] bg-[#171421] text-[#c5b4e8]"
      : "border-[#594823] bg-[#211b11] text-[#e0bd73]";

  return <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${classes}`}>{importance}</span>;
}

function getDocumentLabels(document: OfficialResearchDocumentItem) {
  const fallback = buildFallbackLabels(document);

  return {
    category: document.category ?? fallback.category,
    importance: document.importance ?? fallback.importance,
    summary: document.summary ?? fallback.summary,
    explanation: buildExplanation(document, document.category ?? fallback.category),
  };
}

function buildFallbackLabels(document: OfficialResearchDocumentItem) {
  const company = document.companyName ?? document.title;

  if (document.formType === "10-K") return { category: "Annual reports", importance: "High", summary: `${company} filed its annual report.` };
  if (document.formType === "10-Q") return { category: "Quarterly reports", importance: "High", summary: `${company} filed its quarterly report.` };
  if (document.formType === "DEF 14A") return { category: "Proxy / Governance", importance: "Governance", summary: `${company} filed a proxy statement.` };
  if (document.formType === "8-K") {
    const isEarnings = document.secItems.includes("2.02");
    return { category: isEarnings ? "Earnings" : "Material events", importance: isEarnings ? "High" : "Medium", summary: `${company} filed an 8-K.` };
  }

  return { category: "Official filing", importance: "Medium", summary: `${company} filed ${document.formType ?? "an official document"}.` };
}

function buildExplanation(document: OfficialResearchDocumentItem, category: string) {
  if (category === "Earnings") return "This is usually the fastest route to earnings press releases and updated operating metrics. For 8-K Item 2.02, open Exhibit 99.1 first when available.";
  if (category === "Annual reports") return "This is a full annual report. Use it for business model, risk factors, MD&A, audited financial statements and long-form fundamental review.";
  if (category === "Quarterly reports") return "This is a quarterly report. Use it for recent financials, liquidity, segment commentary and updated risk disclosures.";
  if (category === "Proxy / Governance") return "This is governance material. Use it for executive compensation, board structure, shareholder votes and related-party context.";
  if (document.formType === "8-K") return "This is a material event filing. Check the SEC items to understand why it was filed, then open any Exhibit 99.x attachment for the investor-facing document.";
  return "Official SEC source document. Open the source link to inspect the filing directly.";
}

function describeItem(item: string) {
  const labels: Record<string, string> = {
    "1.01": "Material agreement",
    "2.01": "Acquisition/disposition",
    "2.02": "Results of operations",
    "5.02": "Management changes",
    "7.01": "Reg FD disclosure",
    "8.01": "Other events",
    "9.01": "Financial statements/exhibits",
  };

  return labels[item] ?? "SEC item";
}

function getRangeStart(range: string) {
  const now = new Date();
  if (range === "30D") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range === "90D") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (range === "1Y") return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return null;
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "-";
}

