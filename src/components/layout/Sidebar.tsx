"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  navigationItems,
  type NavigationSection,
} from "@/lib/navigation";

const sections: NavigationSection[] = ["Desk", "Markets", "Workspace"];

export function Sidebar({ language = "en" }: { language?: string }) {
  const pathname = usePathname();
  const isFr = language === "fr";

  return (
    <aside className="w-full min-w-0 max-w-[100vw] overflow-hidden border-b border-[#27282a] bg-[var(--sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-w-none lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-[64px] items-center border-b border-[#222325] px-4 lg:px-5">
        <Link href="/dashboard" className="group flex items-center gap-3 rounded-md">
          <span className="grid size-8 place-items-center rounded-md border border-[#343538] bg-[#151617] text-[10px] font-semibold tracking-[0.08em] text-[#e5e5e5] transition group-hover:border-[#505154]">
            PM
          </span>
          <span className="block text-[13px] font-semibold tracking-[-0.01em] text-[#f0f0f0]">
            Private Macro Desk
          </span>
        </Link>
      </div>

      <nav
        aria-label={isFr ? "Navigation principale" : "Main navigation"}
        className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-3 lg:py-4"
      >
        {sections.map((section) => (
          <div key={section} className="flex shrink-0 gap-1 lg:block">
            <p className="mb-1.5 hidden px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#505052] lg:block">
              {translateSection(section, isFr)}
            </p>
            <div className="flex gap-1 lg:flex-col">
              {navigationItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors lg:w-full ${
                        isActive
                          ? "bg-[#1c1d1f] text-white shadow-[inset_0_0_0_1px_#303134]"
                          : "text-[#79797b] hover:bg-white/[0.035] hover:text-[#d0d0d0]"
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-2 left-0 w-px bg-[#d4d4d4]" />
                      ) : null}
                      <span className="hidden w-5 font-mono text-[8px] tracking-wider text-[#555558] lg:inline">
                        {(isFr ? item.labelFr : item.label).slice(0, 2).toUpperCase()}
                      </span>
                      <span>{isFr ? item.labelFr : item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function translateSection(section: NavigationSection, isFr: boolean) {
  if (!isFr) return section;
  if (section === "Markets") return "Marches";
  if (section === "Workspace") return "Espace";
  return "Desk";
}
