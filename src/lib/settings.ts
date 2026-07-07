import { prisma } from "@/lib/prisma";
export { buildWorkspaceAppearance } from "@/lib/settings-appearance";

export type WorkspaceSettingsView = {
  id: string;
  workspaceName: string;
  language: string;
  timezone: string;
  baseCurrency: string;
  theme: string;
  accentColor: string;
  fontSize: string;
  density: string;
};

export const defaultWorkspaceSettings: Omit<WorkspaceSettingsView, "id"> = {
  workspaceName: "Private Macro Desk",
  language: "en",
  timezone: "Europe/Zurich",
  baseCurrency: "USD",
  theme: "dark",
  accentColor: "green",
  fontSize: "normal",
  density: "compact",
};

export async function getOrCreateWorkspaceSettings(): Promise<WorkspaceSettingsView> {
  try {
    const existing = await prisma.workspaceSettings.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existing) return existing;

    return prisma.workspaceSettings.create({
      data: defaultWorkspaceSettings,
    });
  } catch (error) {
    console.warn("Workspace settings unavailable; using defaults.", error);
    return {
      id: "default-workspace-settings",
      ...defaultWorkspaceSettings,
    };
  }
}
