import { OfficialResearchDocumentList, type OfficialResearchDocumentItem } from "@/components/research/OfficialResearchDocumentList";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getOfficialResearchDocuments() {
  try {
    const documents = await prisma.researchDocument.findMany({
      where: {
        provider: { not: null },
      },
      orderBy: [{ filedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        formType: true,
        filedAt: true,
        provider: true,
        country: true,
        sourceUrl: true,
        fileUrl: true,
        summary: true,
        keyTakeaways: true,
      },
    });

    return documents.map((document): OfficialResearchDocumentItem => ({
      id: document.id,
      title: document.title,
      kind: document.formType,
      filedAt: document.filedAt?.toISOString() ?? null,
      provider: document.provider,
      country: document.country,
      sourceUrl: document.sourceUrl ?? document.fileUrl,
      summary: document.summary,
      keyTakeaways: document.keyTakeaways,
    }));
  } catch (error) {
    console.error("Unable to load official research documents", error);
    return null;
  }
}

export default async function ResearchPage() {
  const documents = await getOfficialResearchDocuments();

  return (
    <>
      <PageHeader eyebrow="Research / Official docs" title="Research library" />

      {!documents ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Research library unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            Can&apos;t reach PostgreSQL. Start the database, check DATABASE_URL, then refresh.
          </p>
        </section>
      ) : (
        <OfficialResearchDocumentList documents={documents} />
      )}
    </>
  );
}
