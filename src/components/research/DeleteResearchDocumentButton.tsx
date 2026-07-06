"use client";

import { deleteResearchDocument } from "@/app/research/actions";

export function DeleteResearchDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  return (
    <form
      action={deleteResearchDocument}
      onSubmit={(event) => {
        if (!window.confirm(`Delete research document "${title}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        className="rounded-md border border-[#513232] bg-[#1d1010] px-3 py-2 text-[11px] text-[#e09a9a] transition hover:border-[#7a3f3f] hover:text-white"
      >
        Delete
      </button>
    </form>
  );
}

