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
        ticker: true,
        title: true,
        companyName: true,
        formType: true,
        filedAt: true,
        reportDate: true,
        provider: true,
        sourceUrl: true,
        fileUrl: true,
        secItems: true,
        exhibits: true,
        importance: true,
        category: true,
        summary: true,
      },
    });

    return documents.map((document): OfficialResearchDocumentItem => ({
      id: document.id,
      ticker: document.ticker,
      title: document.title,
      companyName: document.companyName,
      formType: document.formType,
      filedAt: document.filedAt?.toISOString() ?? null,
      reportDate: document.reportDate?.toISOString() ?? null,
      provider: document.provider,
      sourceUrl: document.sourceUrl ?? document.fileUrl,
      secItems: document.secItems,
      exhibits: normalizeExhibits(document.exhibits),
      importance: document.importance,
      category: document.category,
      summary: document.summary,
    }));
  } catch (error) {
    console.error("Unable to load official research documents", error);
    return null;
  }
}

function normalizeExhibits(value: unknown): OfficialResearchDocumentItem["exhibits"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const exhibit = "exhibit" in entry ? entry.exhibit : null;
      const label = "label" in entry ? entry.label : null;
      const url = "url" in entry ? entry.url : null;

      if (typeof exhibit !== "string" || typeof label !== "string" || typeof url !== "string") {
        return null;
      }

      return { exhibit, label, url };
    })
    .filter((entry): entry is OfficialResearchDocumentItem["exhibits"][number] => entry !== null);
}

export default async function ResearchPage() {
  const documents = await getOfficialResearchDocuments();

  return (
    <>
      <PageHeader
        eyebrow="Research / Official docs"
        title="Research library"
        description="Official source documents synced into the desk. No manual notes, uploads, PDF parsing or AI here yet."
      />

      {!documents ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Research library unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            The app cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page.
          </p>
        </section>
      ) : (
        <OfficialResearchDocumentList documents={documents} />
      )}
    </>
  );
}
