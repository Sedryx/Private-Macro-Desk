import Link from "next/link";

export function DefaultPasswordBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a3220] bg-[#1c1710] px-4 py-2 text-[11px] text-[#c2a35b] sm:px-6 lg:px-8">
      <span>This account is still using its default password.</span>
      <Link href="/settings" className="font-semibold underline underline-offset-2 hover:text-white">
        Change it in Settings &rarr;
      </Link>
    </div>
  );
}
