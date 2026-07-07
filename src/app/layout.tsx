import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";

import "./globals.css";

export const metadata: Metadata = {
  title: "Private Macro Desk",
  description: "A private workspace for market preparation and trade review.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const settings = await getOrCreateWorkspaceSettings();

  return (
    <html lang={settings.language === "fr" ? "fr" : "en"}>
      <body>
        <AppShell settings={settings}>{children}</AppShell>
      </body>
    </html>
  );
}
