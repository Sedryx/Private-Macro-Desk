"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";

export type SettingsValues = {
  workspaceName: string;
  language: string;
  timezone: string;
  baseCurrency: string;
  theme: string;
  accentColor: string;
  fontSize: string;
  density: string;
};

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  values?: SettingsValues;
};

const allowed = {
  language: new Set(["en", "fr"]),
  timezone: new Set(["Europe/Zurich", "America/New_York", "Europe/London", "Asia/Tokyo"]),
  baseCurrency: new Set(["USD", "EUR", "CHF", "GBP", "JPY", "CAD", "AUD"]),
  theme: new Set(["dark", "darker"]),
  accentColor: new Set(["green", "blue", "gray", "amber", "red"]),
  fontSize: new Set(["small", "normal", "large"]),
  density: new Set(["compact", "comfortable", "spacious"]),
};

export async function updateWorkspaceSettings(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const values: SettingsValues = {
    workspaceName: getString(formData, "workspaceName").trim(),
    language: getAllowed(formData, "language", allowed.language, "en"),
    timezone: getAllowed(formData, "timezone", allowed.timezone, "Europe/Zurich"),
    baseCurrency: getAllowed(formData, "baseCurrency", allowed.baseCurrency, "USD"),
    theme: getAllowed(formData, "theme", allowed.theme, "dark"),
    accentColor: getAllowed(formData, "accentColor", allowed.accentColor, "green"),
    fontSize: getAllowed(formData, "fontSize", allowed.fontSize, "normal"),
    density: getAllowed(formData, "density", allowed.density, "compact"),
  };
  const isFr = values.language === "fr";

  if (!values.workspaceName) {
    return { status: "error", message: isFr ? "Le nom du workspace est obligatoire." : "Workspace name is required.", values };
  }

  if (values.workspaceName.length > 80) {
    return { status: "error", message: isFr ? "Le nom du workspace est trop long." : "Workspace name is too long.", values };
  }

  try {
    const settings = await getOrCreateWorkspaceSettings();
    await prisma.workspaceSettings.update({
      where: { id: settings.id },
      data: values,
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { status: "success", message: isFr ? "Reglages sauvegardes." : "Workspace settings saved.", values };
  } catch (error) {
    console.error("Unable to update workspace settings", error);
    return {
      status: "error",
      message: isFr ? "Les reglages n'ont pas pu etre sauvegardes." : "Settings could not be saved.",
      values,
    };
  }
}

export async function updateUserName(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const userId = getString(formData, "userId");
  const name = getString(formData, "name").trim();
  const isFr = getString(formData, "language") === "fr";

  if (!userId || !name) {
    return { status: "error", message: isFr ? "Utilisateur et nom obligatoires." : "User and name are required." };
  }

  if (name.length > 80) {
    return { status: "error", message: isFr ? "Nom trop long." : "Name is too long." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { name } });
    revalidatePath("/settings");
    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: isFr ? "Nom du trader sauvegarde." : "Trader name saved." };
  } catch (error) {
    console.error("Unable to update user name", error);
    return { status: "error", message: isFr ? "Le nom du trader n'a pas pu etre sauvegarde." : "Trader name could not be saved." };
  }
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAllowed(formData: FormData, key: string, values: Set<string>, fallback: string) {
  const value = getString(formData, key);
  return values.has(value) ? value : fallback;
}
