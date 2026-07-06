"use client";

import { useActionState, useState, type ReactNode } from "react";

import {
  addAssetToWatchlist,
  createCustomAssetAndAddToWatchlist,
  type WatchlistActionState,
} from "@/app/watchlist/actions";
import type { AssetOptionView } from "@/components/watchlist/types";

const initialState: WatchlistActionState = { status: "idle", message: "" };
const assetTypes = [
  "STOCK",
  "ETF",
  "INDEX",
  "FOREX",
  "CRYPTO",
  "COMMODITY",
  "RATE",
] as const;

export function AddAssetToWatchlistForm({
  watchlistId,
  assets,
  existingAssetIds,
}: {
  watchlistId: string;
  assets: AssetOptionView[];
  existingAssetIds: string[];
}) {
  const [manualMode, setManualMode] = useState(false);
  const [addState, addAction, addPending] = useActionState(
    addAssetToWatchlist,
    initialState,
  );
  const [customState, customAction, customPending] = useActionState(
    createCustomAssetAndAddToWatchlist,
    initialState,
  );
  const existing = new Set(existingAssetIds);
  const availableAssets = assets.filter((asset) => !existing.has(asset.id));

  return (
    <div className="border-t border-[var(--line)] bg-[#0f1519] p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7e8a84]">
            Add asset
          </p>
          <p className="mt-1 text-[10px] text-[#626d68]">
            Select from the desk universe or create the missing instrument here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setManualMode((value) => !value)}
          className="w-fit rounded-md px-2.5 py-1.5 text-[10px] font-medium text-[#9eaa9a] hover:bg-[#1b2320] hover:text-[#cfdbca]"
        >
          {manualMode
            ? "← Select existing asset"
            : "Asset not listed? Create it manually"}
        </button>
      </div>

      {manualMode ? (
        <form action={customAction} className="mt-4">
          <input type="hidden" name="watchlistId" value={watchlistId} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Symbol *">
              <input
                name="symbol"
                required
                maxLength={30}
                placeholder="USDJPY"
                autoCapitalize="characters"
                className="desk-field px-3 py-2 text-[11px] uppercase"
              />
            </Field>
            <Field label="Name *">
              <input
                name="name"
                required
                maxLength={100}
                placeholder="USD/JPY"
                className="desk-field px-3 py-2 text-[11px]"
              />
            </Field>
            <Field label="Type *">
              <select name="type" required defaultValue="" className="desk-field px-3 py-2 text-[11px]">
                <option value="" disabled>Select type</option>
                {assetTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <input name="currency" maxLength={12} placeholder="USD" className="desk-field px-3 py-2 text-[11px] uppercase" />
            </Field>
            <Field label="Country">
              <input name="country" maxLength={12} placeholder="US" className="desk-field px-3 py-2 text-[11px] uppercase" />
            </Field>
            <Field label="Exchange">
              <input name="exchange" maxLength={40} placeholder="NASDAQ" className="desk-field px-3 py-2 text-[11px] uppercase" />
            </Field>
          </div>
          <ActionFooter
            state={customState}
            pending={customPending}
            idleMessage="The asset will be created and added to this watchlist."
            buttonLabel="Create & add"
          />
        </form>
      ) : (
        <form action={addAction} className="mt-4">
          <input type="hidden" name="watchlistId" value={watchlistId} />
          <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_auto]">
            <select
              name="assetId"
              required
              defaultValue=""
              className="desk-field min-w-0 px-3 py-2 text-[11px]"
            >
              <option value="" disabled>
                {availableAssets.length > 0
                  ? "Select an existing asset"
                  : "No assets available"}
              </option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} · {asset.name} · {asset.type}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addPending || availableAssets.length === 0}
              className="desk-button px-4 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addPending ? "Adding..." : "Add"}
            </button>
          </div>
          <ActionMessage
            state={addState}
            idleMessage={
              assets.length === 0
                ? "No assets available. Create one manually."
                : "Only assets not already in this watchlist are shown."
            }
          />
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] text-[#74807a]">{label}</span>
      {children}
    </label>
  );
}

function ActionFooter({
  state,
  pending,
  idleMessage,
  buttonLabel,
}: {
  state: WatchlistActionState;
  pending: boolean;
  idleMessage: string;
  buttonLabel: string;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
      <ActionMessage state={state} idleMessage={idleMessage} />
      <button
        type="submit"
        disabled={pending}
        className="desk-button w-fit px-4 py-2 text-[11px] font-semibold disabled:opacity-60"
      >
        {pending ? "Creating..." : buttonLabel}
      </button>
    </div>
  );
}

function ActionMessage({
  state,
  idleMessage,
}: {
  state: WatchlistActionState;
  idleMessage: string;
}) {
  return (
    <p
      aria-live="polite"
      className={`mt-2 text-[9px] ${
        state.status === "error"
          ? "text-[var(--danger)]"
          : state.status === "success"
            ? "text-[#9bad90]"
            : "text-[#626d68]"
      }`}
    >
      {state.message || idleMessage}
    </p>
  );
}
