"use client";

import { useActionState } from "react";

import {
  updateWatchlistItem,
  type UpdateWatchlistItemState,
} from "@/app/watchlist/actions";
import type { WatchlistItemView } from "@/components/watchlist/types";

const initialState: UpdateWatchlistItemState = { status: "idle", message: "" };

export function WatchlistItemEditor({
  item,
  onCancel,
}: {
  item: WatchlistItemView;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateWatchlistItem,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="border-t border-[var(--line)] bg-[#0f1519] px-4 py-4 sm:px-5"
    >
      <input type="hidden" name="itemId" value={item.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-[9px] text-[#74807a]">Desk bias</span>
          <select
            name="bias"
            defaultValue={item.bias ?? ""}
            className="desk-field px-3 py-2 text-[11px]"
          >
            <option value="">Not set</option>
            <option value="BULLISH">Bullish</option>
            <option value="BEARISH">Bearish</option>
            <option value="NEUTRAL">Neutral</option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[9px] text-[#74807a]">Important level</span>
          <input
            name="importantLevel"
            maxLength={100}
            defaultValue={item.importantLevel ?? ""}
            placeholder="Level or zone"
            className="desk-field px-3 py-2 text-[11px]"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[9px] text-[#74807a]">Shared note</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={2_000}
          defaultValue={item.notes ?? ""}
          placeholder="Context, trigger or reminder..."
          className="desk-field resize-y px-3 py-2 text-[11px] leading-5"
        />
      </label>
      <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`text-[9px] ${
            state.status === "error" ? "text-[var(--danger)]" : "text-[#74807a]"
          }`}
        >
          {state.message || "Edit only the desk context for this watchlist item."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-[10px] text-[#87928c] hover:bg-[#192025]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="desk-button px-4 py-1.5 text-[10px] font-semibold disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
