export type DataSourceStatus = {
  name: string;
  connected: boolean;
  detail: string;
  latestSyncedAt: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

export function DataSourceStatusCards({ sources, language = "en" }: { sources: DataSourceStatus[]; language?: string }) {
  const isFr = language === "fr";
  return (
    <section className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <p className="terminal-label">{isFr ? "Sources de donnees" : "Data sources"}</p>
        <h2 className="mt-2 text-[15px] font-semibold text-[#e6eae7]">{isFr ? "Statut lecture seule" : "Read-only status"}</h2>
        <p className="mt-1 text-[11px] text-[#77817d]">{isFr ? "Les cles API et secrets ne sont jamais affiches ici." : "API keys and secrets are never shown here."}</p>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {sources.map((source) => (
          <article key={source.name} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[#e6eae7]">{source.name}</h3>
                <p className="mt-1 text-[11px] text-[#707b76]">{source.detail}</p>
              </div>
              <span className={`rounded px-2 py-1 text-[9px] font-semibold ${source.connected ? "border border-[#31513a] bg-[#111d15] text-[#a8d3aa]" : "border border-[#3a3430] bg-[#191512] text-[#b68b3c]"}`}>
                {source.connected ? (isFr ? "Connecte" : "Connected") : (isFr ? "Non synchronise" : "Not synced")}
              </span>
            </div>
            <p className="mt-3 font-mono text-[10px] text-[#68736e]">
              {isFr ? "Derniere sync" : "Latest sync"}: {source.latestSyncedAt ? dateFormatter.format(new Date(source.latestSyncedAt)) : "-"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
