import { generateKeyTakeaways } from "@/lib/ai/researchTakeaways";

export async function syncDocumentChunkAndTakeaways(
  documentId: string,
  status: "created" | "updated",
  title: string,
  fullText: string,
) {
  const { prisma } = await import("@/lib/prisma");

  await prisma.researchChunk.deleteMany({ where: { documentId } });
  await prisma.researchChunk.create({ data: { documentId, content: fullText } });

  if (status !== "created") return;

  const takeaways = await generateKeyTakeaways(title, fullText);
  if (!takeaways) return;

  await prisma.researchDocument.update({ where: { id: documentId }, data: { keyTakeaways: takeaways } });
}
