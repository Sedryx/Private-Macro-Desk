export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex min-h-[68px] min-w-0 max-w-full items-center justify-between gap-4 overflow-hidden border-b border-[var(--line)] bg-[rgba(11,15,19,0.9)] px-5 backdrop-blur-md sm:px-8 lg:px-12">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#cbd1cd]">Shared trading workspace</p>
        <p className="mt-0.5 hidden text-[11px] text-[#6f7975] sm:block">
          Context first. Decisions second.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[#11171c] px-3 py-1.5 text-[11px] text-[#919b96]">
        <span className="size-1.5 rounded-full bg-[#9cab91]" />
        Private <span className="hidden sm:inline">· 2 users</span>
      </div>
    </header>
  );
}
