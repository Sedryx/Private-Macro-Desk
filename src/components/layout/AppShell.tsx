import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent text-slate-100 lg:grid lg:grid-cols-[240px_1fr]">
      <Sidebar />
      <div className="min-w-0">
        <Topbar />
        <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-7 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
