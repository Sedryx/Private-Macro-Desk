type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-6 min-w-0 max-w-3xl">
      <p className="terminal-label">{eyebrow}</p>
      <h1 className="mt-2 text-[26px] font-semibold leading-[1.15] tracking-[-0.035em] text-[#f2f2f2] sm:text-[31px]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl break-words text-[12px] leading-5 text-[#858585] sm:text-[13px]">
        {description}
      </p>
    </header>
  );
}
