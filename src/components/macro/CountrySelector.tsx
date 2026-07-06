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
    <label className="flex items-center gap-2">
      <span className="sr-only">Macro region</span>
      <select
        value={activeId}
        onChange={(event) => onSelect(event.target.value)}
        className="desk-field min-w-[190px] px-3 py-2 text-[11px]"
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>
    </label>
  );
}
