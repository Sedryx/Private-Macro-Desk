import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[var(--canvas)] text-[var(--text)] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <Sidebar />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <Topbar />
        <main className="mx-auto w-full min-w-0 max-w-[1380px] overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
