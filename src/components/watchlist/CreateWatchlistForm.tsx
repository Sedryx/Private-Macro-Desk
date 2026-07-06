"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createWatchlist,
  type WatchlistActionState,
} from "@/app/watchlist/actions";

const initialState: WatchlistActionState = { status: "idle", message: "" };

export function CreateWatchlistForm() {
  const [state, formAction, isPending] = useActionState(
    createWatchlist,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="desk-surface mb-8 w-full p-3 sm:mb-10 sm:max-w-md lg:mb-10"
    >
      <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77837d]">
        Create new watchlist
      </label>
      <div className="mt-2 flex gap-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="e.g. US Session"
          className="desk-field min-w-0 flex-1 px-3 py-2 text-[12px]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="desk-button shrink-0 px-3.5 py-2 text-[11px] font-semibold disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-2 text-[10px] ${
            state.status === "error" ? "text-[var(--danger)]" : "text-[#9bad90]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
