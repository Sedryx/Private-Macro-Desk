import { DocumentType } from "@prisma/client";

const USER_AGENT = "Private Macro Desk/1.0 private research app";
const provider = "Fed";
const ownerEmail = "joachim@private-macro-desk.local";
const CALENDAR_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
const STATEMENT_LIMIT = 12;

export type FedResearchSyncResult = {
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
};

export async function syncFedResearchDocuments(): Promise<FedResearchSyncResult> {
  const calendarHtml = await fetchText(CALENDAR_URL);
  const codes = extractStatementCodes(calendarHtml).slice(0, STATEMENT_LIMIT);
  const uploadedById = await getSyncUserId();

  let created = 0;
  let updated = 0;

  for (const code of codes) {
    const sourceUrl = `https://www.federalreserve.gov/newsevents/pressreleases/monetary${code}a.htm`;
    const statement = await fetchStatement(code, sourceUrl);
    if (!statement) continue;

    const result = await upsertDocument(statement, uploadedById);
    if (result === "created") created += 1;
    if (result === "updated") updated += 1;
  }

  return { status: "synced", created, updated };
}

function extractStatementCodes(calendarHtml: string): string[] {
  const codes = new Set<string>();
  const pattern = /monetary(\d{8})a\.htm/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(calendarHtml)) !== null) {
    codes.add(match[1]);
  }

  return [...codes].sort().reverse();
}

async function fetchStatement(code: string, sourceUrl: string): Promise<NormalizedStatement | null> {
  const html = await fetchText(sourceUrl).catch(() => null);
  if (!html) return null;

  const text = extractArticleText(html);
  if (!text) return null;

  return {
    externalId: code,
    sourceUrl,
    filedAt: parseCode(code),
    title: `FOMC Statement — ${formatDate(parseCode(code))}`,
    summary: summarize(text),
  };
}

function extractArticleText(html: string): string {
  const match = /<div id="article">([\s\S]*?)<div id="lastUpdate"/.exec(html);
  if (!match) return "";

  return match[1]
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(text: string): string {
  const withoutHeader = text.replace(/^.*?For release at [\d:]+\s?[ap]\.m\.\s?\w+\s*/i, "");
  const body = withoutHeader || text;
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

  await prisma.researchDocument.upsert({
    where: { provider_externalId: { provider, externalId: statement.externalId } },
    create: {
      externalId: statement.externalId,
      provider,
      country: "US",
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
  });

  return existing ? "updated" : "created";
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
  const year = Number(code.slice(0, 4));
  const month = Number(code.slice(4, 6));
  const day = Number(code.slice(6, 8));
  return new Date(Date.UTC(year, month - 1, day, 18, 0, 0));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Fed request failed ${response.status}: ${url}`);
  return response.text();
}
