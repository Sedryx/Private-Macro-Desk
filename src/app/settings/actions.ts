"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getSettingsCopy } from "@/lib/i18n/settings";
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
  const labels = getSettingsCopy(values.language).form;

  if (!values.workspaceName) {
    return { status: "error", message: labels.workspaceNameRequired, values };
  }

  if (values.workspaceName.length > 80) {
    return { status: "error", message: labels.workspaceNameTooLong, values };
  }

  try {
    const settings = await getOrCreateWorkspaceSettings();
    await prisma.workspaceSettings.update({
      where: { id: settings.id },
      data: values,
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { status: "success", message: labels.saveSuccess, values };
  } catch (error) {
    console.error("Unable to update workspace settings", error);
    return {
      status: "error",
      message: labels.saveError,
      values,
    };
  }
}

export async function updateUserName(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const labels = getSettingsCopy(getString(formData, "language")).traders;

  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch {
    return { status: "error", message: labels.sessionExpired };
  }

  const requestedUserId = getString(formData, "userId");
  const name = getString(formData, "name").trim();
  const targetUserId = sessionUser.role === "OWNER" && requestedUserId ? requestedUserId : sessionUser.id;

  if (!name) {
    return { status: "error", message: labels.nameRequired };
  }

  if (name.length > 80) {
    return { status: "error", message: labels.nameTooLong };
  }

  try {
    await prisma.user.update({ where: { id: targetUserId }, data: { name } });
    revalidatePath("/settings");
    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: labels.saveSuccess };
  } catch (error) {
    console.error("Unable to update user name", error);
    return { status: "error", message: labels.saveError };
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
