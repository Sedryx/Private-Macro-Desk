"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  addTradeNote,
  type JournalActionState,
} from "@/app/journal/actions";

const initialState: JournalActionState = { status: "idle", message: "" };
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

type ScreenshotPreview = {
  name: string;
  url: string;
};

export function TradeNoteForm({
  tradeId,
  requestId,
}: {
  tradeId: string;
  requestId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<ScreenshotPreview[]>([]);
  const [fileError, setFileError] = useState("");
  const [state, formAction, isPending] = useActionState(addTradeNote, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleScreenshots(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const error = validateSelectedFiles(files);

    setPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return error
        ? []
        : files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    });
    setFileError(error);

    if (error) {
      event.target.value = "";
    }
  }

  function clearScreenshots() {
    setPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return [];
    });
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form ref={formRef} action={formAction} onReset={clearScreenshots} className="mt-4 border-t border-[var(--line)] pt-4">
      <input type="hidden" name="tradeId" value={tradeId} />
      <input type="hidden" name="requestId" value={requestId} />
      <div className="grid gap-3">
        <label>
          <span className="mb-1.5 block text-[10px] font-medium text-[#77817d]">New note <span className="text-[#5f6965]">(optional with screenshots)</span></span>
          <textarea name="content" rows={3} maxLength={2_000} placeholder="Add an observation, or leave empty for a screenshot-only note..." className="desk-field min-h-[78px] resize-y px-3 py-2.5 text-[11px] leading-5" />
        </label>
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-[#354039] bg-[#10161a] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#a5aea9]">Trade screenshots</p>
            <p className="mt-1 text-[10px] text-[#68736e]">PNG, JPEG or WebP · up to 3 images · 5 MB each</p>
            <p className="mt-1 text-[9px] text-[#59645f]">Choose the images, then click Add note to save them.</p>
          </div>
          <div className="flex items-center gap-2">
            {previews.length > 0 ? (
              <button type="button" onClick={clearScreenshots} className="px-2 py-1.5 text-[10px] text-[#89938e] transition hover:text-[#c3cac6]">
                Clear
              </button>
            ) : null}
            <label className="desk-button inline-flex px-3 py-2 text-[10px] font-semibold">
              Choose screenshots
              <input
                ref={fileInputRef}
                name="screenshots"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={handleScreenshots}
              />
            </label>
          </div>
        </div>

        {previews.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {previews.map((preview, index) => (
              <div key={preview.url} className="relative aspect-video overflow-hidden rounded-md border border-[#30393e] bg-[#0b1014]">
                <Image src={preview.url} alt={`Selected screenshot ${index + 1}`} fill unoptimized className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-[8px] text-white/75">{preview.name}</span>
              </div>
            ))}
          </div>
        ) : null}

        {fileError ? <p className="mt-2 text-[10px] text-[var(--danger)]">{fileError}</p> : null}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className={`text-[10px] ${state.status === "error" ? "text-[var(--danger)]" : "text-[#9bab91]"}`}>
          {state.message}
        </p>
        <button type="submit" disabled={isPending || Boolean(fileError)} className="desk-button px-3.5 py-2.5 text-[11px] font-semibold disabled:cursor-wait disabled:opacity-60">
          {isPending ? "Adding..." : "Add note"}
        </button>
      </div>
    </form>
  );
}

function validateSelectedFiles(files: File[]) {
  if (files.length > 3) {
    return "Choose no more than 3 screenshots.";
  }

  if (files.some((file) => !acceptedTypes.has(file.type))) {
    return "Only PNG, JPEG and WebP images are supported.";
  }

  if (files.some((file) => file.size > maxFileSize)) {
    return "Each screenshot must be 5 MB or smaller.";
  }

  return "";
}
