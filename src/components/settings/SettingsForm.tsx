"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";

import { updateWorkspaceSettings, type SettingsActionState, type SettingsValues } from "@/app/settings/actions";
import type { WorkspaceSettingsView } from "@/lib/settings";
import { buildWorkspaceAppearance } from "@/lib/settings-appearance";

const initialState: SettingsActionState = { status: "idle", message: "" };

const copy = {
  en: {
    eyebrow: "Workspace preferences",
    title: "Workspace",
    description: "Shared display defaults for this private desk.",
    workspace: "Workspace",
    name: "Name",
    timezone: "Timezone",
    baseCurrency: "Base currency",
    appearance: "Appearance",
    theme: "Theme",
    accentColor: "Accent color",
    fontSize: "Font size",
    density: "Density",
    language: "Language",
    idle: "Preferences are stored in PostgreSQL. Secrets are not editable here.",
    saving: "Saving...",
    save: "Save settings",
    dark: "Dark",
    darker: "Darker",
    green: "Green",
    blue: "Blue",
    gray: "Gray",
    amber: "Amber",
    red: "Red",
    small: "Small",
    normal: "Normal",
    large: "Large",
    compact: "Compact",
    comfortable: "Comfortable",
    spacious: "Spacious",
  },
  fr: {
    eyebrow: "Preferences du workspace",
    title: "Workspace",
    description: "Reglages partages pour ce desk prive.",
    workspace: "Workspace",
    name: "Nom",
    timezone: "Fuseau horaire",
    baseCurrency: "Devise de base",
    appearance: "Apparence",
    theme: "Theme",
    accentColor: "Couleur d'accent",
    fontSize: "Taille du texte",
    density: "Densite",
    language: "Langue",
    idle: "Les preferences sont sauvegardees dans PostgreSQL. Les secrets ne sont pas editables ici.",
    saving: "Sauvegarde...",
    save: "Sauvegarder",
    dark: "Sombre",
    darker: "Tres sombre",
    green: "Vert",
    blue: "Bleu",
    gray: "Gris",
    amber: "Ambre",
    red: "Rouge",
    small: "Petit",
    normal: "Normal",
    large: "Grand",
    compact: "Compact",
    comfortable: "Confortable",
    spacious: "Espace",
  },
} as const;

export function SettingsForm({ settings }: { settings: WorkspaceSettingsView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SettingsActionState>(initialState);
  const [values, setValues] = useState<SettingsValues>(() => toFormValues(settings));
  const labels = values.language === "fr" ? copy.fr : copy.en;

  function updateValue<Key extends keyof SettingsValues>(key: Key, value: SettingsValues[Key]) {
    const next = { ...values, [key]: value };
    setValues(next);
    applyAppearancePreview(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateWorkspaceSettings(state, formData);
      setState(result);
      if (result.values) {
        setValues(result.values);
        applyAppearancePreview(result.values);
      }
      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <p className="terminal-label">{labels.eyebrow}</p>
        <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">{labels.title}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#77817d]">{labels.description}</p>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">{labels.workspace}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={labels.name}>
              <input name="workspaceName" required value={values.workspaceName} onChange={(event) => updateValue("workspaceName", event.target.value)} maxLength={80} className="desk-field px-3 py-2.5 text-[12px]" />
            </Field>
            <Field label={labels.timezone}>
              <select name="timezone" value={values.timezone} onChange={(event) => updateValue("timezone", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="Europe/Zurich">Europe/Zurich</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </Field>
            <Field label={labels.baseCurrency}>
              <select name="baseCurrency" value={values.baseCurrency} onChange={(event) => updateValue("baseCurrency", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                {["USD", "EUR", "CHF", "GBP", "JPY", "CAD", "AUD"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">{labels.appearance}</p>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label={labels.theme}>
              <select name="theme" value={values.theme} onChange={(event) => updateValue("theme", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="dark">{labels.dark}</option>
                <option value="darker">{labels.darker}</option>
              </select>
            </Field>
            <Field label={labels.accentColor}>
              <select name="accentColor" value={values.accentColor} onChange={(event) => updateValue("accentColor", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="green">{labels.green}</option>
                <option value="blue">{labels.blue}</option>
                <option value="gray">{labels.gray}</option>
                <option value="amber">{labels.amber}</option>
                <option value="red">{labels.red}</option>
              </select>
            </Field>
            <Field label={labels.fontSize}>
              <select name="fontSize" value={values.fontSize} onChange={(event) => updateValue("fontSize", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="small">{labels.small}</option>
                <option value="normal">{labels.normal}</option>
                <option value="large">{labels.large}</option>
              </select>
            </Field>
            <Field label={labels.density}>
              <select name="density" value={values.density} onChange={(event) => updateValue("density", event.target.value)} className="desk-field px-3 py-2.5 text-[12px]">
                <option value="compact">{labels.compact}</option>
                <option value="comfortable">{labels.comfortable}</option>
                <option value="spacious">{labels.spacious}</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">{labels.language}</p>
          <div className="grid max-w-sm gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[#0f1519] px-3.5 py-3 text-[12px] text-[#cbd2ce]">
              <input type="radio" name="language" value="en" checked={values.language === "en"} onChange={() => updateValue("language", "en")} /> EN
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[#0f1519] px-3.5 py-3 text-[12px] text-[#cbd2ce]">
              <input type="radio" name="language" value="fr" checked={values.language === "fr"} onChange={() => updateValue("language", "fr")} /> FR
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className={`text-[11px] ${state.status === "error" ? "text-[var(--negative)]" : "text-[#9bab91]"}`}>{state.message || labels.idle}</p>
          <button type="submit" disabled={isPending} className="desk-button px-4 py-2.5 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60">
            {isPending ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </form>
  );
}

function toFormValues(settings: WorkspaceSettingsView): SettingsValues {
  return {
    workspaceName: settings.workspaceName,
    language: settings.language,
    timezone: settings.timezone,
    baseCurrency: settings.baseCurrency,
    theme: settings.theme,
    accentColor: settings.accentColor,
    fontSize: settings.fontSize,
    density: settings.density,
  };
}

function applyAppearancePreview(values: SettingsValues) {
  const appearance = buildWorkspaceAppearance(values);
  const root = document.documentElement;
  root.lang = values.language === "fr" ? "fr" : "en";
  for (const [property, value] of Object.entries(appearance.style)) {
    root.style.setProperty(property, String(value));
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">{label}</span>
      {children}
    </label>
  );
}
