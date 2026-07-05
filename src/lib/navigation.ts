export type NavigationItem = {
  label: string;
  href: string;
  shortLabel: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", shortLabel: "DB" },
  { label: "Macro", href: "/macro", shortLabel: "MA" },
  { label: "Calendar", href: "/calendar", shortLabel: "CA" },
  { label: "Central Banks", href: "/central-banks", shortLabel: "CB" },
  { label: "Watchlist", href: "/watchlist", shortLabel: "WL" },
  { label: "Journal", href: "/journal", shortLabel: "JR" },
  { label: "Research", href: "/research", shortLabel: "RE" },
  { label: "Settings", href: "/settings", shortLabel: "ST" },
];
