import Link from "next/link";

import { PageHeader } from "@/components/ui/PageHeader";

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="404" title="Page not found" />
      <section className="desk-surface px-6 py-16 text-center">
        <span className="mx-auto block h-px w-8 bg-[#56615b]" />
        <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">This page doesn&apos;t exist.</h2>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
          Check the URL, or head back to the dashboard.
        </p>
        <Link href="/dashboard" className="desk-button mt-6 inline-block px-4 py-2.5 text-[12px] font-semibold">
          Back to dashboard
        </Link>
      </section>
    </>
  );
}
