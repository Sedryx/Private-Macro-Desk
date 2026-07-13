export type NavigationSection = "Desk" | "Markets" | "Workspace";

export type NavigationItem = {
  label: string;
  labelFr: string;
  href: string;
  section: NavigationSection;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", labelFr: "Tableau de bord", href: "/dashboard", section: "Desk" },
  { label: "Watchlist", labelFr: "Watchlists", href: "/watchlist", section: "Desk" },
  { label: "Journal", labelFr: "Journal", href: "/journal", section: "Desk" },
  { label: "Macro", labelFr: "Macro", href: "/macro", section: "Markets" },
  { label: "Calendar", labelFr: "Calendrier", href: "/calendar", section: "Markets" },
  { label: "Research", labelFr: "Recherche", href: "/research", section: "Workspace" },
  { label: "Settings", labelFr: "Reglages", href: "/settings", section: "Workspace" },
];
