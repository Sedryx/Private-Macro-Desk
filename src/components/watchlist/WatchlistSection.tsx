"use client";

import { useActionState, useState } from "react";

import {
  deleteWatchlist,
  renameWatchlist,
  type WatchlistActionState,
} from "@/app/watchlist/actions";
import { AddAssetToWatchlistForm } from "@/components/watchlist/AddAssetToWatchlistForm";
import { WatchlistCompactItem } from "@/components/watchlist/WatchlistCompactItem";
import type {
  AssetOptionView,
  WatchlistView,
} from "@/components/watchlist/types";

const initialState: WatchlistActionState = { status: "idle", message: "" };

export function WatchlistSection({
  watchlist,
  assets,
}: {
  watchlist: WatchlistView;
  assets: AssetOptionView[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState(
    renameWatchlist,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteWatchlist,
    initialState,
  );
  const actionState = deleteState.message ? deleteState : renameState;

  return (
    <section className="desk-surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          {renaming ? (
            <form action={renameAction} className="flex max-w-md gap-2">
              <input type="hidden" name="watchlistId" value={watchlist.id} />
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={watchlist.name}
                className="desk-field min-w-0 px-3 py-1.5 text-[12px]"
              />
              <button
                type="submit"
                disabled={renamePending}
                className="desk-button px-3 py-1.5 text-[10px] font-semibold disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setRenaming(false)}
                className="px-2 py-1.5 text-[10px] text-[#78837e] hover:text-[#c4cbc7]"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#e6ebe7]">
                {watchlist.name}
              </h2>
              <span className="rounded-full border border-[#30393e] bg-[#10161a] px-2 py-0.5 text-[9px] text-[#7d8983]">
                {watchlist.items.length} {watchlist.items.length === 1 ? "asset" : "assets"}
              </span>
            </div>
          )}
          {actionState.message ? (
            <p
              className={`mt-1 text-[9px] ${
                actionState.status === "error"
                  ? "text-[var(--danger)]"
                  : "text-[#9bad90]"
              }`}
            >
              {actionState.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!renaming ? (
            <>
              <button
                type="button"
                onClick={() => setRenaming(true)}
                className="rounded-md px-2 py-1 text-[10px] text-[#7f8a85] hover:bg-[#192025] hover:text-[#c7ceca]"
              >
                Rename
              </button>
              {confirmingDelete ? (
                <form action={deleteAction} className="flex items-center gap-1">
                  <input type="hidden" name="watchlistId" value={watchlist.id} />
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-md px-2 py-1 text-[10px] text-[#7f8a85] hover:bg-[#192025] hover:text-[#c7ceca]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded-md bg-[#28191b] px-2 py-1 text-[10px] font-medium text-[#d59b9b] hover:bg-[#321d20] disabled:opacity-50"
                  >
                    {deletePending ? "Deleting..." : "Confirm delete"}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-md px-2 py-1 text-[10px] text-[#a77878] hover:bg-[#24191b] hover:text-[#d59b9b] disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </>
          ) : null}
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="rounded-md px-2 py-1 text-[10px] text-[#7f8a85] hover:bg-[#192025] hover:text-[#c7ceca]"
          >
            {expanded ? "Collapse −" : "Expand +"}
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="divide-y divide-[var(--line)]">
            {watchlist.items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[12px] font-medium text-[#c7ceca]">No assets yet</p>
                <p className="mt-1 text-[10px] text-[#68736e]">
                  Add an existing instrument or create one below.
                </p>
              </div>
            ) : (
              watchlist.items.map((item) => (
                <WatchlistCompactItem key={item.id} item={item} />
              ))
            )}
          </div>
          <AddAssetToWatchlistForm
            watchlistId={watchlist.id}
            assets={assets}
            existingAssetIds={watchlist.items.map((item) => item.assetId)}
          />
        </>
      ) : null}
    </section>
  );
}
