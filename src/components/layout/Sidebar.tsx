"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  navigationItems,
  type NavigationSection,
} from "@/lib/navigation";

const sections: NavigationSection[] = ["Desk", "Markets", "Workspace"];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full min-w-0 max-w-[100vw] overflow-hidden border-b border-[var(--line)] bg-[var(--sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-w-none lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-[76px] items-center px-5 lg:h-auto lg:px-6 lg:py-7">
        <Link href="/dashboard" className="group flex items-center gap-3.5 rounded-lg">
          <span className="grid size-9 place-items-center rounded-[10px] border border-[#3a433e] bg-[#171d1b] text-[11px] font-semibold tracking-[0.08em] text-[#cbd5c5] transition group-hover:border-[#515e55]">
            PM
          </span>
          <span>
            <span className="block text-[14px] font-semibold tracking-[-0.01em] text-[#eef1ee]">
              Private Macro Desk
            </span>
            <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
              Two-person workspace
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto border-t border-[var(--line)] px-4 py-3 lg:flex-1 lg:flex-col lg:gap-6 lg:overflow-visible lg:border-t-0 lg:px-4 lg:py-2"
      >
        {sections.map((section) => (
          <div key={section} className="flex shrink-0 gap-1 lg:block">
            <p className="mb-2 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#616b67] lg:block">
              {section}
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
                      className={`relative flex shrink-0 items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors lg:w-full ${
                        isActive
                          ? "bg-[var(--accent-soft)] text-[#dde5d8]"
                          : "text-[#8e9893] hover:bg-white/[0.035] hover:text-[#d6dbd8]"
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--accent)]" />
                      ) : null}
                      <span className="lg:pl-1">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden px-6 pb-6 lg:block">
        <div className="rounded-xl border border-[var(--line)] bg-[#11171c] px-4 py-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#aab3ae]">
            <span className="size-1.5 rounded-full bg-[#98aa8d]" />
            Private workspace
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-[#66716c]">
            Built for preparation, decisions and review.
          </p>
        </div>
      </div>
    </aside>
  );
}
