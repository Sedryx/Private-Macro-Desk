import { ResearchDocumentForm } from "@/components/research/ResearchDocumentForm";
import { ResearchDocumentList, type ResearchDocumentItem } from "@/components/research/ResearchDocumentList";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getResearchData() {
  try {
    const [documents, users] = await Promise.all([
      prisma.researchDocument.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          chunks: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, pageNumber: true, createdAt: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
    ]);

    return {
      documents: documents.map((document): ResearchDocumentItem => ({
        id: document.id,
        title: document.title,
        type: document.type,
        source: document.source,
        fileUrl: document.fileUrl,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        uploadedBy: document.uploadedBy,
        chunks: document.chunks.map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          createdAt: chunk.createdAt.toISOString(),
        })),
      })),
      users,
    };
  } catch (error) {
    console.error("Unable to load research library", error);
    return null;
  }
}

export default async function ResearchPage() {
  const data = await getResearchData();

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Documents"
        title="Research library"
        description="A private home for source-backed notes, documents and links. No AI or PDF parsing yet."
      />

      {!data ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Research library unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            The app cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.42fr)_minmax(0,0.58fr)]">
          <ResearchDocumentForm users={data.users} />
          <ResearchDocumentList documents={data.documents} />
        </div>
      )}
    </>
  );
}

