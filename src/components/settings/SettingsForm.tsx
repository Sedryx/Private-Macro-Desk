"use client";

import { useActionState } from "react";

import { updateWorkspaceSettings, type SettingsActionState } from "@/app/settings/actions";
import type { WorkspaceSettingsView } from "@/lib/settings";

const initialState: SettingsActionState = { status: "idle", message: "" };

export function SettingsForm({ settings }: { settings: WorkspaceSettingsView }) {
  const [state, formAction, isPending] = useActionState(updateWorkspaceSettings, initialState);

  return (
    <form action={formAction} className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <p className="terminal-label">Workspace preferences</p>
        <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Workspace</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#77817d]">Shared display defaults for this private desk.</p>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Workspace</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Name">
              <input name="workspaceName" required defaultValue={settings.workspaceName} maxLength={80} className="desk-field px-3 py-2.5 text-[12px]" />
            </Field>
            <Field label="Timezone">
              <select name="timezone" defaultValue={settings.timezone} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="Europe/Zurich">Europe/Zurich</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </Field>
            <Field label="Base currency">
              <select name="baseCurrency" defaultValue={settings.baseCurrency} className="desk-field px-3 py-2.5 text-[12px]">
                {['USD', 'EUR', 'CHF', 'GBP', 'JPY', 'CAD', 'AUD'].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Appearance</p>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Theme">
              <select name="theme" defaultValue={settings.theme} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="dark">Dark</option>
                <option value="darker">Darker</option>
              </select>
            </Field>
            <Field label="Accent color">
              <select name="accentColor" defaultValue={settings.accentColor} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="gray">Gray</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </Field>
            <Field label="Font size">
              <select name="fontSize" defaultValue={settings.fontSize} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </Field>
            <Field label="Density">
              <select name="density" defaultValue={settings.density} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">Language</p>
          <div className="grid max-w-sm gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[#0f1519] px-3.5 py-3 text-[12px] text-[#cbd2ce]">
              <input type="radio" name="language" value="en" defaultChecked={settings.language === "en"} /> EN
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[#0f1519] px-3.5 py-3 text-[12px] text-[#cbd2ce]">
              <input type="radio" name="language" value="fr" defaultChecked={settings.language === "fr"} /> FR
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className={`text-[11px] ${state.status === "error" ? "text-[var(--negative)]" : "text-[#9bab91]"}`}>
            {state.message || "Preferences are stored in PostgreSQL. Secrets are not editable here."}
          </p>
          <button type="submit" disabled={isPending} className="desk-button px-4 py-2.5 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60">
            {isPending ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">{label}</span>
      {children}
    </label>
  );
}

