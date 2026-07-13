"use client";

import { useActionState } from "react";

import { updateUserName, type SettingsActionState } from "@/app/settings/actions";
import { getSettingsCopy } from "@/lib/i18n/settings";

export type TraderSettingsUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
};

const initialState: SettingsActionState = { status: "idle", message: "" };

export function TraderSettingsList({ users, language = "en" }: { users: TraderSettingsUser[]; language?: string }) {
  const labels = getSettingsCopy(language).traders;
  return (
    <section className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <p className="terminal-label">{labels.label}</p>
        <h2 className="mt-2 text-[15px] font-semibold text-[#e6eae7]">{labels.title}</h2>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-8 text-center text-[12px] text-[#78827e]">{labels.empty}</div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {users.map((user) => <TraderNameForm key={user.id} user={user} language={language} />)}
        </div>
      )}
    </section>
  );
}

function TraderNameForm({ user, language = "en" }: { user: TraderSettingsUser; language?: string }) {
  const [state, formAction, isPending] = useActionState(updateUserName, initialState);
  const labels = getSettingsCopy(language).traders;

  return (
    <form action={formAction} className="p-5">
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="language" value={language} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7f8b84]">{user.role}</p>
          <p className="mt-1 truncate text-[10px] text-[#68736e]">{user.email}</p>
        </div>
        <button type="submit" disabled={isPending} className="rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white disabled:opacity-60">
          {labels.save}
        </button>
      </div>
      <input name="name" required defaultValue={user.name} maxLength={80} className="desk-field mt-3 px-3 py-2.5 text-[12px]" />
      {state.message ? <p className={`mt-2 text-[10px] ${state.status === "error" ? "text-[var(--negative)]" : "text-[#9bab91]"}`}>{state.message}</p> : null}
    </form>
  );
}
