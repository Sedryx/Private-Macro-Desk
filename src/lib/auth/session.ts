import { cookies } from "next/headers";

import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from "@/lib/auth/token";

export { SESSION_COOKIE_NAME };

export class UnauthenticatedError extends Error {
  constructor() {
    super("No valid session.");
    this.name = "UnauthenticatedError";
  }
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
  usingDefaultPassword: boolean;
};

// The bootstrap accounts (see src/lib/auth/bootstrap.ts) are created with these exact
// passwords. Checking the hash directly (rather than a stored flag) means the warning
// disappears the moment a real password is set, with no extra schema/migration needed.
const DEFAULT_BOOTSTRAP_PASSWORDS = ["user1", "user2"];

function isUsingDefaultPassword(passwordHash: string | null): boolean {
  if (!passwordHash) return false;
  return DEFAULT_BOOTSTRAP_PASSWORDS.some((candidate) => verifyPassword(candidate, passwordHash));
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    usingDefaultPassword: isUsingDefaultPassword(user.passwordHash),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  return user;
}
