"use server";

import { Bias } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "joachim@private-macro-desk.local";
const MAIN_WATCHLIST_NAME = "Main Watchlist";

export type UpdateWatchlistItemState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateWatchlistItem(
  _previousState: UpdateWatchlistItemState,
  formData: FormData,
): Promise<UpdateWatchlistItemState> {
  const itemId = getString(formData, "itemId");
  const rawBias = getString(formData, "bias");
  const importantLevel = getString(formData, "importantLevel").trim();
  const notes = getString(formData, "notes").trim();

  if (!itemId) {
    return { status: "error", message: "Missing watchlist item." };
  }

  const bias = rawBias === "" ? null : parseBias(rawBias);

  if (rawBias !== "" && bias === null) {
    return { status: "error", message: "Invalid bias value." };
  }

  if (importantLevel.length > 100) {
    return { status: "error", message: "Important level is limited to 100 characters." };
  }

  if (notes.length > 2_000) {
    return { status: "error", message: "Notes are limited to 2,000 characters." };
  }

  try {
    const item = await prisma.watchlistItem.findFirst({
      where: {
        id: itemId,
        watchlist: {
          is: {
            name: MAIN_WATCHLIST_NAME,
            user: { is: { email: OWNER_EMAIL } },
          },
        },
      },
      select: { id: true },
    });

    if (!item) {
      return { status: "error", message: "Watchlist item not found." };
    }

    await prisma.watchlistItem.update({
      where: { id: item.id },
      data: {
        bias,
        importantLevel: importantLevel || null,
        notes: notes || null,
      },
    });

    revalidatePath("/watchlist");
    return { status: "success", message: "Saved." };
  } catch (error) {
    console.error("Unable to update watchlist item", error);
    return { status: "error", message: "Save failed. Check the database connection." };
  }
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseBias(value: string): Bias | null {
  return Object.values(Bias).includes(value as Bias) ? (value as Bias) : null;
}
