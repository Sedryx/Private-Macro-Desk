import { cookies } from "next/headers";

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
};

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
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  return user;
}
