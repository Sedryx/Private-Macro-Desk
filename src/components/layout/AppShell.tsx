import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { TerminalHeader } from "@/components/layout/TerminalHeader";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[var(--canvas)] text-[var(--text)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <Sidebar />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <TerminalHeader />
        <main className="mx-auto w-full min-w-0 max-w-[1560px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
