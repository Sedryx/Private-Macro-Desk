import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { TerminalHeader } from "@/components/layout/TerminalHeader";
import { buildWorkspaceAppearance, type WorkspaceSettingsView } from "@/lib/settings";

type AppShellProps = {
  children: ReactNode;
  settings: WorkspaceSettingsView;
};

export function AppShell({ children, settings }: AppShellProps) {
  const appearance = buildWorkspaceAppearance(settings);

  return (
    <div
      className={`${appearance.className} min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[var(--canvas)] text-[var(--text)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]`}
      style={appearance.style}
    >
      <Sidebar language={settings.language} />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <TerminalHeader language={settings.language} />
        <main className="mx-auto w-full min-w-0 max-w-[1560px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
