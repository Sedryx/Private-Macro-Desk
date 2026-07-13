"use client";

import { useActionState, useEffect, useRef, useState } from "react";

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

const NONE_VALUE = "NONE";

export function TradeCreateForm({ assets }: { assets: SelectOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createTrade, initialState);
  const unavailableReason = assets.length === 0
    ? "No assets are available. Run the seed or create an asset first."
    : null;

  const [dailyTrend, setDailyTrend] = useState(NONE_VALUE);
  const [entryZone, setEntryZone] = useState(NONE_VALUE);
  const [entrySignal, setEntrySignal] = useState(NONE_VALUE);
  const [handledState, setHandledState] = useState(state);

  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") {
      setDailyTrend(NONE_VALUE);
      setEntryZone(NONE_VALUE);
      setEntrySignal(NONE_VALUE);
    }
  }

  const setupScore = [dailyTrend, entryZone, entrySignal].filter((value) => value !== NONE_VALUE).length;
  const isSetupValid = setupScore === 3;

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
      </div>

      {unavailableReason ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="text-[13px] text-[#a8b0ac]">{unavailableReason}</p>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldLabel label="Asset">
              <select name="assetId" required className="desk-field px-3 py-2.5 text-[12px]">
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.symbol} - {asset.name}</option>
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

          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#0f1519] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#707b76]">Setup checklist</p>
                <p className="mt-1 text-[11px] text-[#78827e]">Daily trend / 4H zone / 1H signal, top-down.</p>
              </div>
              <span
                className={
                  "rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.08em] " +
                  (isSetupValid
                    ? "border-[#176b35] bg-[var(--positive-soft)] text-[#3fca6f]"
                    : "border-[#3b4449] bg-[#171d21] text-[#9ca6a1]")
                }
              >
                {setupScore}/3 {isSetupValid ? "· Valid setup" : "· Incomplete"}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FieldLabel label="Strategy">
                <input
                  name="strategyCode"
                  type="text"
                  defaultValue="EURUSD_TREND_D4H1H"
                  className="desk-field px-3 py-2.5 text-[12px]"
                />
              </FieldLabel>

              <FieldLabel label="Daily trend">
                <select
                  name="dailyTrend"
                  value={dailyTrend}
                  onChange={(event) => setDailyTrend(event.target.value)}
                  className="desk-field px-3 py-2.5 text-[12px]"
                >
                  <option value={NONE_VALUE}>Not set</option>
                  <option value="BULLISH">Bullish (EMA50 &gt; EMA200)</option>
                  <option value="BEARISH">Bearish (EMA50 &lt; EMA200)</option>
                  <option value="RANGE">Range / flat EMAs</option>
                </select>
              </FieldLabel>

              <FieldLabel label="4H entry zone">
                <select
                  name="entryZone"
                  value={entryZone}
                  onChange={(event) => setEntryZone(event.target.value)}
                  className="desk-field px-3 py-2.5 text-[12px]"
                >
                  <option value={NONE_VALUE}>Not reached</option>
                  <option value="EMA50_PULLBACK">EMA50 pullback</option>
                  <option value="SUPPORT_RESISTANCE">Support / resistance</option>
                  <option value="FIB_RETRACEMENT">Fib retracement 38-61%</option>
                </select>
              </FieldLabel>

              <FieldLabel label="1H signal">
                <select
                  name="entrySignal"
                  value={entrySignal}
                  onChange={(event) => setEntrySignal(event.target.value)}
                  className="desk-field px-3 py-2.5 text-[12px]"
                >
                  <option value={NONE_VALUE}>No signal yet</option>
                  <option value="ENGULFING">Engulfing candle</option>
                  <option value="PIN_BAR">Pin bar</option>
                  <option value="RSI_OVERSOLD">RSI exiting oversold</option>
                  <option value="RSI_OVERBOUGHT">RSI exiting overbought</option>
                </select>
              </FieldLabel>
            </div>

            {!isSetupValid ? (
              <p className="mt-3 text-[10px] text-[#8d9792]">
                All three steps must be set to mark this as a valid, rule-based setup rather than a discretionary trade.
              </p>
            ) : null}
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
