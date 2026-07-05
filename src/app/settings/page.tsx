import { PageHeader } from "@/components/ui/PageHeader";
import { PlannedList } from "@/components/ui/PlannedList";
import { SectionCard } from "@/components/ui/SectionCard";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace / Settings"
        title="Desk settings"
        description="Only the preferences needed by this private workspace will live here."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Workspace" description="Small shared preferences for two users." meta="Planned">
          <PlannedList items={["Workspace identity", "Display preferences", "User preferences"]} note="There will be no subscription, billing or organisation management." />
        </SectionCard>
        <SectionCard title="Data sources" description="A transparent place to manage future data connections." meta="Planned">
          <PlannedList items={["Source status", "Refresh preferences", "Attribution"]} note="Only free or openly accessible sources are planned." />
        </SectionCard>
      </div>
    </>
  );
}
