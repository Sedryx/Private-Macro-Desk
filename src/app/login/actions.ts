"use server";

import { redirect } from "next/navigation";

import { clearLoginAttempts, getLockoutRemainingSeconds, recordFailedLogin } from "@/lib/auth/loginAttempts";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type LoginActionState = {
  status: "idle" | "error";
  message: string;
};

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export async function login(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = getString(formData, "email").trim().toLowerCase();
  const password = getString(formData, "password");

  if (!email || !password) {
    return { status: "error", message: INVALID_CREDENTIALS_MESSAGE };
  }

  const lockedSeconds = getLockoutRemainingSeconds(email);
  if (lockedSeconds > 0) {
    const minutes = Math.ceil(lockedSeconds / 60);
    return {
      status: "error",
      message: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    recordFailedLogin(email);
    return { status: "error", message: INVALID_CREDENTIALS_MESSAGE };
  }

  clearLoginAttempts(email);
  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
