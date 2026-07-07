"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function removeResearchDocumentLocalCopy(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }

  const documentId = getString(formData, "documentId");

  if (!documentId) return;

  try {
    await prisma.$transaction([
      prisma.researchChunk.deleteMany({ where: { documentId } }),
      prisma.researchDocument.delete({ where: { id: documentId } }),
    ]);

    revalidatePath("/research");
  } catch (error) {
    console.error("Unable to remove local research document copy", error);
  }
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

