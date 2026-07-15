import { DocumentType } from "@prisma/client";

import { syncDocumentChunkAndTakeaways } from "@/lib/data/researchChunks";

const USER_AGENT = "Private Macro Desk/1.0 private research app";
const provider = "ECB";
const ownerEmail = "joachim@private-macro-desk.local";
const STATEMENT_LIMIT = 12;

export type EcbResearchSyncResult = {
  status: "synced";
  created: number;
  updated: number;
};

type NormalizedStatement = {
  externalId: string;
  sourceUrl: string;
  filedAt: Date;
  title: string;
  summary: string;
  fullText: string;
};

export async function syncEcbResearchDocuments(): Promise<EcbResearchSyncResult> {
  const currentYear = new Date().getUTCFullYear();
  const entries = [
    ...await listYear(currentYear),
    ...await listYear(currentYear - 1).catch(() => []),
  ].slice(0, STATEMENT_LIMIT);

  const uploadedById = await getSyncUserId();
  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    const statement = await fetchStatement(entry).catch(() => null);
    if (!statement) continue;

    const result = await upsertDocument(statement, uploadedById);
    if (result.status === "created") created += 1;
    if (result.status === "updated") updated += 1;
    await syncDocumentChunkAndTakeaways(result.id, result.status, statement.title, statement.fullText);
  }

  return { status: "synced", created, updated };
}

type IndexEntry = { code: string; path: string };

async function listYear(year: number): Promise<IndexEntry[]> {
  const url = `https://www.ecb.europa.eu/press/press_conference/monetary-policy-statement/${year}/html/index_include.en.html`;
  const html = await fetchText(url);
  const pattern = /href="(\/press\/press_conference\/monetary-policy-statement\/\d{4}\/html\/ecb\.is(\d{6})~[0-9a-f]+\.en\.html)"/g;
  const entries = new Map<string, IndexEntry>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    entries.set(match[2], { code: match[2], path: match[1] });
  }

  return [...entries.values()].sort((left, right) => right.code.localeCompare(left.code));
}

async function fetchStatement(entry: IndexEntry): Promise<NormalizedStatement | null> {
  const sourceUrl = `https://www.ecb.europa.eu${entry.path}`;
  const html = await fetchText(sourceUrl);
  const text = extractArticleText(html);
  if (!text) return null;

  const filedAt = parseCode(entry.code);
  return {
    externalId: entry.code,
    sourceUrl,
    filedAt,
    title: `ECB Monetary Policy Statement — ${formatDate(filedAt)}`,
    summary: summarize(text),
    fullText: text,
  };
}

function extractArticleText(html: string): string {
  const match = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html);
  if (!match) return "";

  return match[1]
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(text: string): string {
  const withoutHeader = text.replace(/^.*?welcome you to our press conference\.\s*/i, "");
  const body = withoutHeader.length > 100 ? withoutHeader : text;
  const truncated = body.slice(0, 480);
  const lastPeriod = truncated.lastIndexOf(". ");
  return lastPeriod > 200 ? `${truncated.slice(0, lastPeriod + 1)}` : `${truncated.trim()}…`;
}

async function upsertDocument(statement: NormalizedStatement, uploadedById: string) {
  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.researchDocument.findUnique({
    where: { provider_externalId: { provider, externalId: statement.externalId } },
    select: { id: true },
  });

  const document = await prisma.researchDocument.upsert({
    where: { provider_externalId: { provider, externalId: statement.externalId } },
    create: {
      externalId: statement.externalId,
      provider,
      country: "EU",
      formType: "Statement",
      filedAt: statement.filedAt,
      sourceUrl: statement.sourceUrl,
      fileUrl: statement.sourceUrl,
      category: "Statement",
      summary: statement.summary,
      title: statement.title,
      type: DocumentType.ARTICLE,
      source: provider,
      uploadedById,
    },
    update: {
      filedAt: statement.filedAt,
      sourceUrl: statement.sourceUrl,
      fileUrl: statement.sourceUrl,
      summary: statement.summary,
      title: statement.title,
      source: provider,
    },
    select: { id: true },
  });

  return { id: document.id, status: existing ? ("updated" as const) : ("created" as const) };
}

async function getSyncUserId() {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findFirst({
    where: { email: ownerEmail },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  }) ?? await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!user) {
    throw new Error("No user found. Run npx prisma db seed first.");
  }

  return user.id;
}

function parseCode(code: string): Date {
  const year = 2000 + Number(code.slice(0, 2));
  const month = Number(code.slice(2, 4));
  const day = Number(code.slice(4, 6));
  return new Date(Date.UTC(year, month - 1, day, 12, 30, 0));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`ECB request failed ${response.status}: ${url}`);
  return response.text();
}
