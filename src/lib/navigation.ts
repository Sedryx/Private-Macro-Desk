export type NavigationSection = "Desk" | "Markets" | "Workspace";

export type NavigationItem = {
  label: string;
  href: string;
  section: NavigationSection;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", section: "Desk" },
  { label: "Watchlist", href: "/watchlist", section: "Desk" },
  { label: "Journal", href: "/journal", section: "Desk" },
  { label: "Macro", href: "/macro", section: "Markets" },
  { label: "Calendar", href: "/calendar", section: "Markets" },
  { label: "Central Banks", href: "/central-banks", section: "Markets" },
  { label: "Research", href: "/research", section: "Workspace" },
  { label: "Settings", href: "/settings", section: "Workspace" },
];
