"use client";

import { useActionState } from "react";
import Image from "next/image";

import {
  updateTradeStatus,
  type JournalActionState,
} from "@/app/journal/actions";
import { TradeNoteForm } from "@/components/journal/TradeNoteForm";
import type { JournalUser, TradeView } from "@/components/journal/TradeList";

const initialState: JournalActionState = { status: "idle", message: "" };

const directionTone = {
  LONG: "border-[#3e4b3d] bg-[#1a231b] text-[#b1c1a7]",
  SHORT: "border-[#513b3c] bg-[#24191a] text-[#d0a09c]",
};

const statusTone = {
  PLANNED: "border-[#3b4449] bg-[#171d21] text-[#9ca6a1]",
  OPEN: "border-[#40503e] bg-[#1a241b] text-[#b2c2a8]",
  CLOSED: "border-[#39454d] bg-[#172027] text-[#9babb4]",
  CANCELLED: "border-[#4b3c3c] bg-[#211919] text-[#b89592]",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Zurich",
});

export function TradeCard({ trade, users }: { trade: TradeView; users: JournalUser[] }) {
  const [statusState, statusAction, isStatusPending] = useActionState(updateTradeStatus, initialState);

  return (
    <article className="desk-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[18px] font-semibold tracking-[-0.025em] text-[#eef1ee]">{trade.asset.symbol}</h3>
            <Badge className={directionTone[trade.direction]}>{trade.direction}</Badge>
            <Badge className={statusTone[trade.status]}>{formatStatus(trade.status)}</Badge>
          </div>
          <p className="mt-1 text-[12px] text-[#7b8580]">{trade.asset.name}</p>
          <p className="mt-2 text-[11px] text-[#626d68]">
            Added by {trade.user.name} · {formatDate(trade.createdAt)}
          </p>
        </div>

        <form action={statusAction} className="flex flex-wrap items-end gap-2 lg:justify-end">
          <input type="hidden" name="tradeId" value={trade.id} />
          <label>
            <span className="mb-1.5 block text-[10px] font-medium text-[#77817d]">Trade status</span>
            <select name="status" defaultValue={trade.status} className="desk-field min-w-32 px-3 py-2 text-[11px]">
              <option value="PLANNED">Planned</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <button type="submit" disabled={isStatusPending} className="desk-button px-3.5 py-2 text-[11px] font-semibold disabled:cursor-wait disabled:opacity-60">
            {isStatusPending ? "Updating..." : "Update"}
          </button>
          <span aria-live="polite" className={`basis-full text-right text-[10px] ${statusState.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}>
            {statusState.message}
          </span>
        </form>
      </div>

      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Entry" value={trade.entryPrice} />
        <Metric label="Stop loss" value={trade.stopLoss} />
        <Metric label="Take profit" value={trade.takeProfit} />
        <Metric label="Risk" value={trade.riskPercent ? `${trade.riskPercent}%` : null} />
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="space-y-5">
          <TextBlock label="Thesis" value={trade.thesis} />
          <TextBlock label="Invalidation" value={trade.invalidation} empty="No invalidation recorded." />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextBlock label="Result" value={trade.result} empty="No result recorded." />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#707b76]">Mistake tags</p>
              {trade.mistakeTags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {trade.mistakeTags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#343d42] bg-[#11171b] px-2.5 py-1 text-[10px] text-[#8d9792]">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12px] text-[#626d68]">No mistakes tagged.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-[var(--line)] bg-[#0f1519] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#707b76]">Timeline</p>
          <dl className="mt-3 space-y-3">
            <TimelineRow label="Created" value={formatDate(trade.createdAt)} />
            <TimelineRow label="Opened" value={formatDate(trade.openedAt)} />
            <TimelineRow label="Closed" value={formatDate(trade.closedAt)} />
          </dl>
        </aside>
      </div>

      <div className="border-t border-[var(--line)] bg-[#0f1418] px-5 py-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#707b76]">Discussion</p>
            <h4 className="mt-1.5 text-[14px] font-semibold text-[#dce1dd]">Trade notes</h4>
          </div>
          <span className="text-[10px] text-[#626d68]">{trade.notes.length} {trade.notes.length === 1 ? "note" : "notes"}</span>
        </div>

        {trade.notes.length > 0 ? (
          <div className="mt-4 space-y-2.5">
            {trade.notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-[var(--line)] bg-[#12181d] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#aeb7b2]">{note.user.name}</p>
                  <time className="text-[9px] text-[#5f6965]">{formatDate(note.createdAt)}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[#8e9893]">{note.content}</p>
                {note.screenshotUrls.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {note.screenshotUrls.map((screenshotUrl, index) => (
                      <a
                        key={screenshotUrl}
                        href={screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-video overflow-hidden rounded-lg border border-[#30393e] bg-[#0c1115]"
                      >
                        <Image
                          src={screenshotUrl}
                          alt={`Trade screenshot ${index + 1} added by ${note.user.name}`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 320px"
                          className="object-cover transition duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
                        />
                        <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-[9px] text-white/80 opacity-0 transition group-hover:opacity-100">
                          Open full size
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[12px] text-[#68736e]">No discussion yet. Add the first observation below.</p>
        )}

        <TradeNoteForm tradeId={trade.id} users={users} defaultUserId={trade.userId} requestId={trade.noteRequestId} />
      </div>
    </article>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.08em] ${className}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-[var(--surface)] px-5 py-4 sm:px-6">
      <p className="text-[10px] font-medium text-[#65706b]">{label}</p>
      <p className={`mt-1.5 text-[14px] font-semibold ${value ? "text-[#d9deda]" : "text-[#56605c]"}`}>{value ?? "Not set"}</p>
    </div>
  );
}

function TextBlock({ label, value, empty = "Not recorded." }: { label: string; value: string | null; empty?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#707b76]">{label}</p>
      <p className={`mt-2 whitespace-pre-wrap text-[13px] leading-6 ${value ? "text-[#aeb6b2]" : "text-[#626d68]"}`}>{value || empty}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[11px]">
      <dt className="text-[#68736e]">{label}</dt>
      <dd className="text-right text-[#9ba49f]">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded";
}

function formatStatus(status: TradeView["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
