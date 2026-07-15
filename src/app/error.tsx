"use client";

import { useEffect } from "react";

import { PageHeader } from "@/components/ui/PageHeader";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <>
      <PageHeader eyebrow="Error" title="Something went wrong" />
      <section className="desk-surface px-6 py-16 text-center">
        <span className="mx-auto block h-px w-8 bg-[#56615b]" />
        <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Unexpected error.</h2>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
          {error.message || "Something failed while rendering this page."}
        </p>
        <button type="button" onClick={() => reset()} className="desk-button mt-6 px-4 py-2.5 text-[12px] font-semibold">
          Try again
        </button>
      </section>
    </>
  );
}
