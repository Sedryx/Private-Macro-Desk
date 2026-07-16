"use client";

import { useActionState, useEffect } from "react";

import { updateTrade, type JournalActionState } from "@/app/journal/actions";
import type { TradeView } from "@/components/journal/TradeList";

const initialState: JournalActionState = { status: "idle", message: "" };

export function TradeEditForm({ trade, onDone }: { trade: TradeView; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(updateTrade, initialState);

  useEffect(() => {
    if (state.status === "success") {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-5 px-5 py-6 sm:px-6">
      <input type="hidden" name="tradeId" value={trade.id} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberField name="entryPrice" label="Entry" defaultValue={trade.entryPrice} />
        <NumberField name="stopLoss" label="Stop loss" defaultValue={trade.stopLoss} />
        <NumberField name="takeProfit" label="Take profit" defaultValue={trade.takeProfit} />
        <NumberField name="riskPercent" label="Risk %" defaultValue={trade.riskPercent} />
      </div>

      <FieldLabel label="Strategy">
        <input
          name="strategyCode"
          type="text"
          defaultValue={trade.strategyCode ?? ""}
          placeholder="e.g. EURUSD_TREND_D4H1H"
          className="desk-field px-3 py-2.5 text-[12px]"
        />
      </FieldLabel>

      <FieldLabel label="Thesis">
        <textarea
          name="thesis"
          required
          defaultValue={trade.thesis}
          rows={4}
          maxLength={5_000}
          className="desk-field px-3 py-2.5 text-[12px]"
        />
      </FieldLabel>

      <FieldLabel label="Invalidation">
        <textarea
          name="invalidation"
          defaultValue={trade.invalidation ?? ""}
          rows={2}
          maxLength={2_000}
          className="desk-field px-3 py-2.5 text-[12px]"
        />
      </FieldLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Result">
          <textarea
            name="result"
            defaultValue={trade.result ?? ""}
            rows={2}
            maxLength={2_000}
            placeholder="What happened, in your own words"
            className="desk-field px-3 py-2.5 text-[12px]"
          />
        </FieldLabel>
        <FieldLabel label="Mistake tags">
          <input
            name="mistakeTags"
            type="text"
            defaultValue={trade.mistakeTags.join(", ")}
            placeholder="e.g. moved stop, oversized, chased entry"
            className="desk-field px-3 py-2.5 text-[12px]"
          />
          <span className="mt-1.5 block text-[10px] text-[#626d68]">Comma-separated.</span>
        </FieldLabel>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg border border-[var(--line)] bg-[#0c1013] px-3.5 py-2 text-[11px] font-semibold text-[#9aa39f] transition hover:border-[#3a4540] hover:text-[#e2e7e4] disabled:cursor-wait disabled:opacity-60"
        >
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="desk-button px-3.5 py-2 text-[11px] font-semibold disabled:cursor-wait disabled:opacity-60">
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
      {state.status === "error" ? (
        <p aria-live="polite" className="text-right text-[10px] text-[var(--danger)]">{state.message}</p>
      ) : null}
    </form>
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

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string | null }) {
  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type="text"
        inputMode="decimal"
        defaultValue={defaultValue ?? ""}
        className="desk-field px-3 py-2.5 text-[12px]"
      />
    </FieldLabel>
  );
}
