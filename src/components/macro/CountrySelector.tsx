import type { CountryMacroProfile } from "@/lib/macroProfiles";

export function CountrySelector({
  profiles,
  activeId,
  onSelect,
}: {
  profiles: CountryMacroProfile[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const tabs = [
    { id: "global", label: "Global Overview" },
    ...profiles.map((profile) => ({ id: profile.id, label: profile.tabLabel })),
  ];

  return (
    <nav aria-label="Macro region" className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-1 rounded-xl border border-[var(--line)] bg-[#0e1419] p-1">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-[#242d31] text-[#eef1ee] shadow-sm"
                  : "text-[#77827d] hover:bg-[#171e23] hover:text-[#c3cac6]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
