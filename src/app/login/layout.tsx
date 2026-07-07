import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--canvas)] px-4 text-[var(--text)]">
      {children}
    </div>
  );
}
