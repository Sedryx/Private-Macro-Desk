import type { CSSProperties } from "react";

export type WorkspaceAppearanceInput = {
  accentColor: string;
  fontSize: string;
  density: string;
  theme: string;
};

const accentMap = {
  green: { accent: "#16a34a", soft: "rgba(22, 163, 74, 0.13)", positive: "#16a34a" },
  blue: { accent: "#3b82f6", soft: "rgba(59, 130, 246, 0.13)", positive: "#3b82f6" },
  gray: { accent: "#a3a3a3", soft: "rgba(163, 163, 163, 0.12)", positive: "#a3a3a3" },
  amber: { accent: "#d97706", soft: "rgba(217, 119, 6, 0.13)", positive: "#d97706" },
  red: { accent: "#dc2626", soft: "rgba(220, 38, 38, 0.12)", positive: "#dc2626" },
} as const;

export function buildWorkspaceAppearance(settings: WorkspaceAppearanceInput) {
  const accent = accentMap[settings.accentColor as keyof typeof accentMap] ?? accentMap.green;
  const fontScale = settings.fontSize === "small" ? "0.94" : settings.fontSize === "large" ? "1.06" : "1";
  const densityScale = settings.density === "comfortable" ? "1.14" : settings.density === "spacious" ? "1.28" : "1";

  return {
    className: [
      `theme-${settings.theme === "darker" ? "darker" : "dark"}`,
      `density-${settings.density}`,
      `font-${settings.fontSize}`,
    ].join(" "),
    style: {
      "--accent": accent.accent,
      "--accent-soft": accent.soft,
      "--positive": accent.positive,
      "--workspace-font-scale": fontScale,
      "--workspace-density-scale": densityScale,
    } as CSSProperties,
  };
}
