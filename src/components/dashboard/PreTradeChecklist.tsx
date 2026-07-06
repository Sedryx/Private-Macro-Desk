"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { SectionCard } from "@/components/ui/SectionCard";

const checklist = [
  "Macro context checked",
  "Important event today?",
  "Level defined",
  "Invalidation defined",
  "Risk size defined",
  "Other trader informed",
];

const storageKey = "pmd:pre-trade-checklist";
const storageEventName = "pmd:pre-trade-checklist-updated";

type StoredChecklist = {
  dateKey: string;
  checked: Record<string, boolean>;
};

export function PreTradeChecklist() {
  const todayKey = useMemo(() => getZurichDateKey(new Date()), []);
  const emptySnapshot = useMemo(() => serializeChecklist(todayKey, {}), [todayKey]);
  const snapshot = useSyncExternalStore(
    subscribeToChecklist,
    () => getChecklistSnapshot(todayKey),
    () => emptySnapshot,
  );
  const checked = useMemo(() => parseChecklistSnapshot(snapshot, todayKey), [snapshot, todayKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDateKey = getZurichDateKey(new Date());
      if (currentDateKey !== todayKey) {
        window.localStorage.removeItem(storageKey);
        notifyChecklistSubscribers();
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [todayKey]);

  const completed = checklist.filter((item) => checked[item]).length;

  function toggleItem(item: string) {
    const next = { ...checked, [item]: !checked[item] };
    saveStoredChecklist(todayKey, next);
  }

  function resetChecklist() {
    window.localStorage.removeItem(storageKey);
    notifyChecklistSubscribers();
  }

  return (
    <SectionCard
      eyebrow="Process"
      title="Pre-Trade Checklist"
      description="Daily checklist saved locally in this browser. It resets automatically every Zurich day."
      meta={`${completed}/${checklist.length}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] text-[#68736e]">Reset every 24h / Zurich date.</p>
        <button
          type="button"
          onClick={resetChecklist}
          className="rounded-md border border-[#30393e] bg-[#11181c] px-2.5 py-1 text-[10px] text-[#9aa49f] transition hover:border-[#4a5650] hover:text-white"
        >
          Reset now
        </button>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {checklist.map((item) => {
          const isChecked = Boolean(checked[item]);

          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className={
                  "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-[11px] transition " +
                  (isChecked
                    ? "border-[#2f5c3c] bg-[#102018] text-[#dce8de]"
                    : "border-[var(--line)] bg-[#0f1519] text-[#9ba49f] hover:border-[#3b4640] hover:text-[#d9dfdc]")
                }
              >
                <span
                  className={
                    "grid size-3.5 shrink-0 place-items-center rounded border text-[9px] " +
                    (isChecked ? "border-[#4da166] bg-[#1f8b42] text-white" : "border-[#4a5650]")
                  }
                  aria-hidden="true"
                >
                  {isChecked ? "✓" : ""}
                </span>
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function subscribeToChecklist(callback: () => void) {
  window.addEventListener(storageEventName, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(storageEventName, callback);
    window.removeEventListener("storage", callback);
  };
}

function getChecklistSnapshot(todayKey: string) {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return serializeChecklist(todayKey, {});

  try {
    const parsed = JSON.parse(stored) as StoredChecklist;
    if (parsed.dateKey !== todayKey) {
      window.localStorage.removeItem(storageKey);
      return serializeChecklist(todayKey, {});
    }

    return serializeChecklist(todayKey, parsed.checked ?? {});
  } catch {
    window.localStorage.removeItem(storageKey);
    return serializeChecklist(todayKey, {});
  }
}

function parseChecklistSnapshot(snapshot: string, todayKey: string) {
  try {
    const parsed = JSON.parse(snapshot) as StoredChecklist;
    return parsed.dateKey === todayKey ? parsed.checked ?? {} : {};
  } catch {
    return {};
  }
}

function saveStoredChecklist(todayKey: string, checked: Record<string, boolean>) {
  window.localStorage.setItem(storageKey, serializeChecklist(todayKey, checked));
  notifyChecklistSubscribers();
}

function notifyChecklistSubscribers() {
  window.dispatchEvent(new Event(storageEventName));
}

function serializeChecklist(todayKey: string, checked: Record<string, boolean>) {
  return JSON.stringify({ dateKey: todayKey, checked });
}

function getZurichDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Zurich",
    year: "numeric",
  }).format(date);
}

