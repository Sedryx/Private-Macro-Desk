import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";

import "./globals.css";

export const metadata: Metadata = {
  title: "Private Macro Desk",
  description: "A private workspace for market preparation and trade review.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const settings = await getOrCreateWorkspaceSettings();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/login";
  const user = isLoginRoute ? null : await getSessionUser();

  // A session cookie can be present but stale (expired, wrong secret, or referencing a
  // user that no longer exists — e.g. after a fresh database reset). Every route other
  // than /login requires a validated session; without this, pages rendered fully for an
  // unauthenticated visitor since only mutating server actions checked requireUser().
  if (!isLoginRoute && !user) {
    redirect("/login");
  }

  return (
    <html lang={settings.language === "fr" ? "fr" : "en"}>
      <body>
        {isLoginRoute ? children : (
          <AppShell settings={settings} user={user}>{children}</AppShell>
        )}
      </body>
    </html>
  );
}
