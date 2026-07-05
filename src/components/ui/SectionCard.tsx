import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function SectionCard({ title, description, children, className = "" }: SectionCardProps) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/55 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.16)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
        </div>
        <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
          Placeholder
        </span>
      </div>
      {children}
    </section>
  );
}
