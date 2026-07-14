"use client";

import { removeResearchDocumentLocalCopy } from "@/app/research/actions";

export function RemoveLocalResearchCopyButton({ documentId, title }: { documentId: string; title: string }) {
  return (
    <form
      action={removeResearchDocumentLocalCopy}
      onSubmit={(event) => {
        if (!window.confirm(`Remove local copy of "${title}"? It can be synced again later.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        title="Remove local copy"
        className="rounded-md border border-[#30393e] bg-[#11181c] px-2 py-1.5 text-[9px] text-[#8d9792] transition hover:border-[#7a3f3f] hover:text-[#e09a9a]"
      >
        Remove
      </button>
    </form>
  );
}

