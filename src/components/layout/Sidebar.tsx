"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-800/80 bg-[#0b0f15]/95 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5 lg:h-20">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10 font-mono text-xs font-bold text-blue-300">
            PM
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-100">Macro Desk</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Workspace 01</p>
          </div>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:p-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-blue-500/20 bg-blue-500/10 text-blue-200"
                  : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              <span className={`font-mono text-[10px] ${isActive ? "text-blue-400" : "text-slate-600"}`}>
                {item.shortLabel}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden px-5 py-6 lg:block">
        <div className="border-t border-slate-800 pt-4 font-mono text-[10px] uppercase tracking-widest text-slate-600">
          Private workspace
        </div>
      </div>
    </aside>
  );
}
