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
    <section className={`desk-surface p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-5">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#e4e8e5]">{title}</h2>
          {description ? (
            <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-[#7f8985]">{description}</p>
          ) : null}
        </div>
        {meta ? (
          <span className="shrink-0 rounded-full border border-[#30383d] bg-[#10161a] px-2.5 py-1 text-[10px] font-medium text-[#7f8985]">
            {meta}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
