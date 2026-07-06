"use client";

import { DocumentType } from "@prisma/client";
import { useActionState, useEffect, useRef } from "react";

import { createResearchDocument, type ResearchActionState } from "@/app/research/actions";

type UserOption = {
  id: string;
  name: string;
  email: string;
};

const initialState: ResearchActionState = { status: "idle", message: "" };

const documentTypes = Object.values(DocumentType);

export function ResearchDocumentForm({ users }: { users: UserOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createResearchDocument, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="desk-surface overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <p className="terminal-label">Library / Add source</p>
        <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#e6eae7]">Add document</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#77817d]">Save notes, filings, PDFs or article links with traceable source metadata.</p>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="text-[13px] text-[#a8b0ac]">No users found. Run the seed before adding research documents.</p>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="Title">
              <input name="title" required maxLength={240} placeholder="e.g. FOMC minutes notes" className="desk-field px-3 py-2.5 text-[12px]" />
            </FieldLabel>

            <FieldLabel label="Type">
              <select name="type" required defaultValue="NOTE" className="desk-field px-3 py-2.5 text-[12px]">
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Uploaded by">
              <select name="uploadedById" required className="desk-field px-3 py-2.5 text-[12px]">
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Source">
              <input name="source" placeholder="Optional source / publisher" className="desk-field px-3 py-2.5 text-[12px]" />
            </FieldLabel>
          </div>

          <div className="mt-4">
            <FieldLabel label="File or source URL">
              <input name="fileUrl" type="url" placeholder="https://..." className="desk-field px-3 py-2.5 text-[12px]" />
            </FieldLabel>
          </div>

          <div className="mt-4">
            <FieldLabel label="Content / note">
              <textarea
                name="content"
                rows={8}
                maxLength={20_000}
                placeholder="Optional. If filled, it will be saved as the first research chunk."
                className="desk-field min-h-48 resize-y px-3 py-2.5 text-[12px] leading-5"
              />
            </FieldLabel>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className={`text-[11px] ${state.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}>
              {state.message || "No PDF parsing or upload storage yet. Save links and notes only."}
            </p>
            <button type="submit" disabled={isPending} className="desk-button px-4 py-2.5 text-[12px] font-semibold disabled:cursor-wait disabled:opacity-60">
              {isPending ? "Saving..." : "Save document"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#8e9893]">{label}</span>
      {children}
    </label>
  );
}

