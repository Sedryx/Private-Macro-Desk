import Link from "next/link";

import type { DailyMacroBriefView } from "@/lib/ai/dailyBrief";

export function TodayFocusCard({ brief }: { brief: DailyMacroBriefView | null }) {
  return (
    <article className="desk-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="terminal-label">Today // AI take{brief ? ` · ${formatGeneratedAt(brief.generatedAt)}` : ""}</p>
          <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Daily macro recap</h3>
        </div>
        <Link href="/macro" className="shrink-0 text-[10px] font-medium text-[#aeb8b2] transition hover:text-white">
          Open macro -&gt;
        </Link>
      </div>

      {brief ? (
        <>
          <p className="mt-4 text-[12px] leading-5 text-[#c2c9c4]">{brief.recap}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.08em] text-[#5f6965]">Risk sentiment</span>
            <span className="text-[11px] font-semibold text-[#dfe4e0]">{brief.riskSentimentScore}/100</span>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[#30393e] bg-[#0f1519] px-4 py-8 text-center">
          <p className="text-[12px] text-[#7d8782]">AI daily brief not generated yet.</p>
          <p className="mt-1 text-[10px] text-[#58635e]">
            Set <span className="font-mono text-[#7f8984]">GEMINI_API_KEY</span> and wait for the next sync, or run{" "}
            <span className="font-mono text-[#7f8984]">npm run data:ai:brief</span>.
          </p>
        </div>
      )}
    </article>
  );
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  }).format(new Date(value));
}
