import Link from "next/link";

import { formatMacroDelta, formatMacroValue, type MacroSnapshotItem } from "@/lib/dashboard";

type MacroSnapshotWidgetProps = {
  items: MacroSnapshotItem[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Zurich",
  year: "numeric",
});

export function MacroSnapshotWidget({ items }: MacroSnapshotWidgetProps) {
  return (
    <article className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-4">
        <div>
          <p className="terminal-label">Macro</p>
          <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Macro Snapshot</h3>
        </div>
        <Link href="/macro" className="text-[10px] font-medium text-[#aeb8b2] transition hover:text-white">
          Open macro -&gt;
        </Link>
      </div>

      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const delta = formatMacroDelta(item);
          const tone = item.delta === null ? "text-[#66706b]" : item.delta > 0 ? "text-[var(--positive)]" : item.delta < 0 ? "text-[var(--negative)]" : "text-[#8b958f]";

          return (
            <div key={item.code} className="bg-[#101518] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-medium text-[#aeb8b2]">{item.label}</p>
                {delta ? <span className={`font-mono text-[10px] ${tone}`}>{delta}</span> : null}
              </div>
              <p className="mt-3 font-mono text-[22px] font-semibold tracking-[-0.04em] text-[#e8ece9]">{formatMacroValue(item)}</p>
              <p className="mt-1 text-[10px] text-[#65706b]">
                {item.date ? `Latest / ${dateFormatter.format(new Date(item.date))}` : "No DB value"}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

