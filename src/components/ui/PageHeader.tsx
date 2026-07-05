type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 min-w-0 max-w-3xl sm:mb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f9d88]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.035em] text-[#f0f2ef] sm:text-[38px]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl break-words text-[14px] leading-6 text-[#8f9994] sm:text-[15px]">
        {description}
      </p>
    </header>
  );
}
