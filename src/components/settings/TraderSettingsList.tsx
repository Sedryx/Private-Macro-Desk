"use client";

import { useActionState, useState } from "react";

import { updateTraderIdentity, updateTraderPassword, type SettingsActionState } from "@/app/settings/actions";
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
          {users.map((user) => <TraderIdentityForm key={user.id} user={user} language={language} />)}
        </div>
      )}
    </section>
  );
}

function TraderIdentityForm({ user, language = "en" }: { user: TraderSettingsUser; language?: string }) {
  const [state, formAction, isPending] = useActionState(updateTraderIdentity, initialState);
  const [email, setEmail] = useState(user.email);
  const labels = getSettingsCopy(language).traders;
  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();

  return (
    <div className="p-5">
      <form action={formAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="language" value={language} />
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7f8b84]">{user.role}</p>
          <button type="submit" disabled={isPending} className="rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white disabled:opacity-60">
            {labels.save}
          </button>
        </div>
        <input name="name" required defaultValue={user.name} maxLength={80} className="desk-field mt-3 px-3 py-2.5 text-[12px]" />
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="desk-field mt-2 px-3 py-2.5 text-[12px]"
        />
        {emailChanged ? (
          <div className="mt-2 space-y-2 rounded-md border border-[#3a3220] bg-[#1c1710] p-3">
            <p className="text-[10px] leading-4 text-[#c2a35b]">{labels.emailChangeWarning}</p>
            <input
              name="password"
              type="password"
              required
              placeholder={labels.confirmPasswordLabel}
              className="desk-field px-3 py-2.5 text-[12px]"
            />
          </div>
        ) : null}
        {state.message ? <p className={`mt-2 text-[10px] ${state.status === "error" ? "text-[var(--negative)]" : "text-[#9bab91]"}`}>{state.message}</p> : null}
      </form>

      <TraderPasswordForm userId={user.id} language={language} />
    </div>
  );
}

function TraderPasswordForm({ userId, language = "en" }: { userId: string; language?: string }) {
  const [state, formAction, isPending] = useActionState(updateTraderPassword, initialState);
  const labels = getSettingsCopy(language).traders;

  return (
    <details className="mt-4 rounded-md border border-[var(--line)] bg-[#11161a] p-3">
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7f8b84]">
        {labels.changePasswordTitle}
      </summary>
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="language" value={language} />
        <input name="newPassword" type="password" required placeholder={labels.newPasswordLabel} className="desk-field px-3 py-2.5 text-[12px]" />
        <input name="confirmNewPassword" type="password" required placeholder={labels.confirmNewPasswordLabel} className="desk-field px-3 py-2.5 text-[12px]" />
        <input name="password" type="password" required placeholder={labels.confirmPasswordLabel} className="desk-field px-3 py-2.5 text-[12px]" />
        <button type="submit" disabled={isPending} className="rounded-md border border-[#30393e] bg-[#11181c] px-3 py-2 text-[11px] text-[#aeb8b2] transition hover:border-[#4a5650] hover:text-white disabled:opacity-60">
          {labels.changePasswordButton}
        </button>
        {state.message ? <p className={`text-[10px] ${state.status === "error" ? "text-[var(--negative)]" : "text-[#9bab91]"}`}>{state.message}</p> : null}
      </form>
    </details>
  );
}
