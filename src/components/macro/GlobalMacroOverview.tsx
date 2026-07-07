import type { CountryMacroProfile } from "@/lib/macroProfiles";

export function GlobalMacroOverview({ profiles }: { profiles: CountryMacroProfile[] }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="terminal-label">Cross-country monitor // Policy</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[#e7ebe8]">Global policy board</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {profiles.map((profile) => (
          <article key={profile.id} className="desk-surface overflow-hidden p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[9px] font-semibold tracking-[0.12em] text-[#718078]">{profile.countryCode}</span>
                <h3 className="mt-1 text-[13px] font-semibold text-[#e2e7e3]">{profile.country}</h3>
                <p className="mt-1 text-[9px] text-[#68736e]">{profile.centralBank}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <SourceBadge profile={profile} />
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 border-t border-[var(--line)] pt-3">
              <Row label="Policy rate" value={profile.policyRate} />
              <Row label="Inflation" value={profile.inflation} />
              <Row label="Unemployment" value={profile.unemployment} />
              <Row label="FX / proxy" value={profile.marketProxy} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceBadge({ profile }: { profile: CountryMacroProfile }) {
  const sources = Object.values(profile.sections).flatMap((section) =>
    section.indicators.map((indicator) => indicator.source),
  );
  const hasLiveData = sources.some((source) =>
    ["FRED", "FRED / calculated", "FRED fallback", "Eurostat", "Eurostat flash", "ECB", "SNB", "BFS", "ONS", "BoE", "BOJ", "DBnomics", "FRED/OECD", "FRED / Japan Cabinet Office", "e-Stat"].includes(source),
  );
  const label = hasLiveData ? profile.stance : profile.countryCode === "US" || profile.countryCode === "EU" ? "Not connected" : "Coming soon";

  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[7px] font-semibold ${
        hasLiveData
          ? "border-[#385044] bg-[#15231b] text-[#9fc0a5]"
          : "border-[#394147] bg-[#171d21] text-[#8d9993]"
      }`}
    >
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[9px] text-[#626d68]">{label}</dt>
      <dd className="text-right text-[10px] font-medium text-[#b9c1bc]">{value}</dd>
    </div>
  );
}


