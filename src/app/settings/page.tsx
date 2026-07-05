import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function SettingsPage() {
  return <><PageHeader eyebrow="Workspace" title="Settings" description="Manage the small set of preferences for this private two-user workspace." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Workspace Preferences" description="Display and shared workspace options will appear here." /><SectionCard title="Data Preferences" description="Data sources and refresh preferences will be configured here later." /></div></>;
}
