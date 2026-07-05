export function Topbar() {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-800/80 bg-[#080b10]/80 px-5 backdrop-blur sm:px-7 lg:px-10">
      <div>
        <h1 className="text-sm font-semibold tracking-wide text-slate-100 sm:text-base">Private Macro Desk</h1>
        <p className="mt-0.5 text-xs text-slate-500">Private trading cockpit</p>
      </div>
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
        Private / 2 users
      </span>
    </header>
  );
}
