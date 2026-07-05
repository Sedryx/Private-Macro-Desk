"use client";

import { useActionState } from "react";

import {
  updateWatchlistItem,
  type UpdateWatchlistItemState,
} from "@/app/watchlist/actions";
import type { WatchlistItemView } from "@/components/watchlist/WatchlistTable";

const initialState: UpdateWatchlistItemState = { status: "idle", message: "" };

const biasTone = {
  BULLISH: "text-[#afbea5]",
  BEARISH: "text-[#ca9994]",
  NEUTRAL: "text-[#a9b1ad]",
};

export function WatchlistItemEditor({ item }: { item: WatchlistItemView }) {
  const [state, formAction, isPending] = useActionState(updateWatchlistItem, initialState);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[#333d42] sm:p-5"
    >
      <input type="hidden" name="itemId" value={item.id} />

      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#edf0ed]">
              {item.asset.symbol}
            </h3>
            <span className="rounded-md border border-[#30393e] bg-[#10161a] px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-[#8e9994]">
              {item.asset.type}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#7c8682]">{item.asset.name}</p>
        </div>
        <p className="shrink-0 pt-1 text-[10px] text-[#65706b]">
          {[item.asset.currency, item.asset.country].filter(Boolean).join(" / ") || "Not specified"}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">Desk bias</span>
          <select
            name="bias"
            defaultValue={item.bias ?? ""}
            className={`desk-field px-3 py-2.5 text-[12px] ${item.bias ? biasTone[item.bias] : "text-[#78827e]"}`}
          >
            <option value="">Not set</option>
            <option value="BULLISH">Bullish</option>
            <option value="BEARISH">Bearish</option>
            <option value="NEUTRAL">Neutral</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">Important level</span>
          <input
            name="importantLevel"
            type="text"
            maxLength={100}
            defaultValue={item.importantLevel ?? ""}
            placeholder="Add a level or zone"
            className="desk-field px-3 py-2.5 text-[12px]"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">Shared note</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={2_000}
          defaultValue={item.notes ?? ""}
          placeholder="What should both of you remember about this market?"
          className="desk-field min-h-20 resize-y px-3 py-2.5 text-[12px] leading-5"
        />
      </label>

      <div className="mt-4 flex min-h-9 items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
        <span
          aria-live="polite"
          className={`text-[11px] ${state.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}
        >
          {state.message || "Changes are saved per instrument."}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="desk-button min-w-[76px] px-3.5 py-2 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
