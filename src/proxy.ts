import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

const PUBLIC_PATH_PREFIXES = ["/login", "/uploads/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );

  if (!isPublic) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = token ? await verifySessionToken(token) : null;

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
