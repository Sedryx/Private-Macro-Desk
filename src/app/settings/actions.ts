"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateWorkspaceSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
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
  const workspaceName = getString(formData, "workspaceName").trim();
  const language = getAllowed(formData, "language", allowed.language, "en");
  const timezone = getAllowed(formData, "timezone", allowed.timezone, "Europe/Zurich");
  const baseCurrency = getAllowed(formData, "baseCurrency", allowed.baseCurrency, "USD");
  const theme = getAllowed(formData, "theme", allowed.theme, "dark");
  const accentColor = getAllowed(formData, "accentColor", allowed.accentColor, "green");
  const fontSize = getAllowed(formData, "fontSize", allowed.fontSize, "normal");
  const density = getAllowed(formData, "density", allowed.density, "compact");

  if (!workspaceName) {
    return { status: "error", message: "Workspace name is required." };
  }

  if (workspaceName.length > 80) {
    return { status: "error", message: "Workspace name is too long." };
  }

  try {
    const settings = await getOrCreateWorkspaceSettings();
    await prisma.workspaceSettings.update({
      where: { id: settings.id },
      data: { workspaceName, language, timezone, baseCurrency, theme, accentColor, fontSize, density },
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { status: "success", message: "Workspace settings saved." };
  } catch (error) {
    console.error("Unable to update workspace settings", error);
    return { status: "error", message: "Settings could not be saved." };
  }
}

export async function updateUserName(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const userId = getString(formData, "userId");
  const name = getString(formData, "name").trim();

  if (!userId || !name) {
    return { status: "error", message: "User and name are required." };
  }

  if (name.length > 80) {
    return { status: "error", message: "Name is too long." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { name } });
    revalidatePath("/settings");
    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: "Trader name saved." };
  } catch (error) {
    console.error("Unable to update user name", error);
    return { status: "error", message: "Trader name could not be saved." };
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

