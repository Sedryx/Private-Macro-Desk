"use client";

import { useActionState, useState } from "react";

import {
  removeAssetFromWatchlist,
  type WatchlistActionState,
} from "@/app/watchlist/actions";
import { WatchlistItemEditor } from "@/components/watchlist/WatchlistItemEditor";
import type { WatchlistItemView } from "@/components/watchlist/types";

const initialState: WatchlistActionState = { status: "idle", message: "" };

const biasStyles = {
  BULLISH: "border-[#176b35] bg-[var(--positive-soft)] text-[#3fca6f]",
  BEARISH: "border-[#742b2b] bg-[var(--negative-soft)] text-[#ef6a6a]",
  NEUTRAL: "border-[#444548] bg-[#1a1b1c] text-[#c6c6c6]",
};

export function WatchlistCompactItem({ item }: { item: WatchlistItemView }) {
  const [editing, setEditing] = useState(false);
  const [removeState, removeAction, removePending] = useActionState(
    removeAssetFromWatchlist,
    initialState,
  );

  return (
    <article className="bg-[var(--surface)]">
      <div className="grid gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-[minmax(210px,1.1fr)_minmax(130px,0.55fr)_minmax(110px,0.5fr)_minmax(180px,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[#e8ece9]">
              {item.asset.symbol}
            </h3>
            <span className="rounded-md border border-[#30393e] bg-[#10161a] px-1.5 py-0.5 text-[8px] font-semibold text-[#8d9893]">
              {item.asset.type}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-[#747f7a]">
            {item.asset.name}
            {item.asset.currency || item.asset.country
              ? ` · ${[item.asset.currency, item.asset.country].filter(Boolean).join(" / ")}`
              : ""}
          </p>
        </div>

        <div>
          <p className="text-[8px] uppercase tracking-[0.08em] text-[#5e6964]">Bias</p>
          <span
            className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[8px] font-semibold ${
              item.bias
                ? biasStyles[item.bias]
                : "border-[#343d42] bg-[#141a1e] text-[#707b76]"
            }`}
          >
            {item.bias ?? "NOT SET"}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-[0.08em] text-[#5e6964]">Important level</p>
          <p className="mt-1 truncate text-[10px] font-medium text-[#b6bfba]">
            {item.importantLevel || "—"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-[0.08em] text-[#5e6964]">Note</p>
          <p className="mt-1 truncate text-[10px] text-[#87918c]">
            {item.notes || "No note"}
          </p>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="desk-button px-3 py-1.5 text-[10px] font-semibold"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <form action={removeAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              disabled={removePending}
              className="rounded-lg border border-[#4a3535] bg-[#211717] px-3 py-1.5 text-[10px] font-medium text-[#c28f8b] hover:border-[#654645] disabled:opacity-50"
            >
              {removePending ? "Removing..." : "Remove"}
            </button>
          </form>
        </div>
      </div>

      {removeState.status === "error" ? (
        <p className="px-5 pb-3 text-[9px] text-[var(--danger)]">
          {removeState.message}
        </p>
      ) : null}

      {editing ? (
        <WatchlistItemEditor
          item={item}
          onCancel={() => setEditing(false)}
        />
      ) : null}
    </article>
  );
}
