import { SectionCard } from "@/components/ui/SectionCard";

const checklist = [
  "Macro context checked",
  "Important event today?",
  "Level defined",
  "Invalidation defined",
  "Risk size defined",
  "Other trader informed",
];

export function PreTradeChecklist() {
  return (
    <SectionCard
      eyebrow="Process"
      title="Pre-Trade Checklist"
      description="A visual reminder for now. Nothing here is saved yet."
      meta="Visual only"
    >
      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[#0f1519] px-3.5 py-3 text-[11px] text-[#9ba49f]">
            <span className="size-3.5 shrink-0 rounded border border-[#4a5650]" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
