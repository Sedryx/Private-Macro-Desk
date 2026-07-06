import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: string;
  children?: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  eyebrow,
  meta,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={"desk-surface p-4 sm:p-5 " + className}>
      <div className="flex items-start justify-between gap-5">
        <div>
          {eyebrow ? <p className="terminal-label mb-2">{eyebrow}</p> : null}
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[#eeeeee]">{title}</h2>
          {description ? (
            <p className="mt-1.5 max-w-xl text-[11px] leading-5 text-[#797979]">{description}</p>
          ) : null}
        </div>
        {meta ? (
          <span className="shrink-0 rounded-md border border-[#343538] bg-[#101112] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#777779]">
            {meta}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
