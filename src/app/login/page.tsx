"use client";

import { useActionState } from "react";

import { login, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { status: "idle", message: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <section className="desk-surface w-full max-w-sm overflow-hidden">
      <div className="border-b border-[var(--line)] px-6 py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Private Macro Desk</p>
        <h1 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Sign in</h1>
      </div>

      <form action={formAction} className="p-6">
        <label className="block">
          <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            className="desk-field px-3 py-2.5 text-[12px]"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="desk-field px-3 py-2.5 text-[12px]"
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-5">
          <p aria-live="polite" className={`text-[11px] ${state.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}>
            {state.message || " "}
          </p>
          <button type="submit" disabled={isPending} className="desk-button px-4 py-2.5 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60">
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </section>
  );
}
