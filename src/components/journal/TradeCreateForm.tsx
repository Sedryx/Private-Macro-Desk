"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createTrade,
  type JournalActionState,
} from "@/app/journal/actions";

type SelectOption = {
  id: string;
  name: string;
  symbol?: string;
};

const initialState: JournalActionState = { status: "idle", message: "" };

export function TradeCreateForm({ assets, users }: { assets: SelectOption[]; users: SelectOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createTrade, initialState);
  const unavailableReason = assets.length === 0
    ? "No assets are available. Run the seed or create an asset first."
    : users.length === 0
      ? "No traders are available. Run the seed before creating a trade."
      : null;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Preparation</p>
        <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Create trade idea</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#77817d]">Write the plan before the market writes the story for you.</p>
      </div>

      {unavailableReason ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="text-[13px] text-[#a8b0ac]">{unavailableReason}</p>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FieldLabel label="Asset">
              <select name="assetId" required className="desk-field px-3 py-2.5 text-[12px]">
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.symbol} - {asset.name}</option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Trader">
              <select name="userId" required className="desk-field px-3 py-2.5 text-[12px]">
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Direction">
              <select name="direction" required defaultValue="LONG" className="desk-field px-3 py-2.5 text-[12px]">
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Status">
              <select name="status" required defaultValue="PLANNED" className="desk-field px-3 py-2.5 text-[12px]">
                <option value="PLANNED">Planned</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </FieldLabel>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberField name="entryPrice" label="Entry price" placeholder="Optional" />
            <NumberField name="stopLoss" label="Stop loss" placeholder="Optional" />
            <NumberField name="takeProfit" label="Take profit" placeholder="Optional" />
            <NumberField name="riskPercent" label="Risk percent" placeholder="Optional" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <FieldLabel label="Thesis">
              <textarea
                name="thesis"
                required
                rows={4}
                maxLength={5_000}
                placeholder="Why does this trade deserve to exist?"
                className="desk-field min-h-28 resize-y px-3 py-2.5 text-[12px] leading-5"
              />
            </FieldLabel>
            <FieldLabel label="Invalidation">
              <textarea
                name="invalidation"
                rows={4}
                maxLength={2_000}
                placeholder="What would prove the idea wrong?"
                className="desk-field min-h-28 resize-y px-3 py-2.5 text-[12px] leading-5"
              />
            </FieldLabel>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className={`text-[11px] ${state.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}>
              {state.message || "Optional numeric fields may be left empty."}
            </p>
            <button type="submit" disabled={isPending} className="desk-button px-4 py-2.5 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60">
              {isPending ? "Saving..." : "Add trade idea"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <FieldLabel label={label}>
      <input name={name} type="text" inputMode="decimal" placeholder={placeholder} className="desk-field px-3 py-2.5 text-[12px]" />
    </FieldLabel>
  );
}
