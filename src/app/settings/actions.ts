"use server";

import { revalidatePath } from "next/cache";

import { verifyPassword } from "@/lib/auth/password";
import { requireUser, setSessionCookie } from "@/lib/auth/session";
import { getSettingsCopy } from "@/lib/i18n/settings";
import { prisma } from "@/lib/prisma";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EmailTakenError extends Error {}

export type SettingsValues = {
  language: string;
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
    language: getAllowed(formData, "language", allowed.language, "en"),
    theme: getAllowed(formData, "theme", allowed.theme, "dark"),
    accentColor: getAllowed(formData, "accentColor", allowed.accentColor, "green"),
    fontSize: getAllowed(formData, "fontSize", allowed.fontSize, "normal"),
    density: getAllowed(formData, "density", allowed.density, "compact"),
  };
  const labels = getSettingsCopy(values.language).form;

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

export async function updateTraderIdentity(
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
  const targetUserId = sessionUser.role === "OWNER" && requestedUserId ? requestedUserId : sessionUser.id;

  const name = getString(formData, "name").trim();
  const email = getString(formData, "email").trim().toLowerCase();
  const password = getString(formData, "password");

  if (!name) return { status: "error", message: labels.nameRequired };
  if (name.length > 80) return { status: "error", message: labels.nameTooLong };
  if (!email) return { status: "error", message: labels.emailRequired };
  if (!EMAIL_PATTERN.test(email)) return { status: "error", message: labels.emailInvalid };

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) return { status: "error", message: labels.saveError };

  const emailChanged = email !== targetUser.email.toLowerCase();

  if (!emailChanged) {
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

  // Email is changing: this migrates to a brand-new account, so confirm the
  // acting trader's own password before deleting anything.
  if (!password) return { status: "error", message: labels.passwordRequired };

  const actingUser = sessionUser.id === targetUserId
    ? targetUser
    : await prisma.user.findUnique({ where: { id: sessionUser.id } });

  if (!actingUser?.passwordHash || !verifyPassword(password, actingUser.passwordHash)) {
    return { status: "error", message: labels.passwordIncorrect };
  }

  try {
    const newUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) throw new EmailTakenError();

      const created = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: targetUser.passwordHash,
          role: targetUser.role,
        },
      });

      await tx.watchlist.updateMany({ where: { userId: targetUserId }, data: { userId: created.id } });
      await tx.trade.updateMany({ where: { userId: targetUserId }, data: { userId: created.id } });
      await tx.tradeNote.updateMany({ where: { userId: targetUserId }, data: { userId: created.id } });
      await tx.researchDocument.updateMany({ where: { uploadedById: targetUserId }, data: { uploadedById: created.id } });

      // The old row must be deleted last — every FK above is Cascade, so
      // deleting first would wipe the data instead of transferring it.
      await tx.user.delete({ where: { id: targetUserId } });

      return created;
    });

    if (targetUserId === sessionUser.id) {
      await setSessionCookie(newUser.id);
    }

    revalidatePath("/settings");
    revalidatePath("/journal");
    revalidatePath("/dashboard");
    revalidatePath("/watchlist");
    return { status: "success", message: labels.migrateSuccess };
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { status: "error", message: labels.emailTaken };
    }
    console.error("Unable to migrate trader account", error);
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
