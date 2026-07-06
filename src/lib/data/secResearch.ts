import { DocumentType } from "@prisma/client";

type SecTickerEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

type SecCompanyTickers = Record<string, SecTickerEntry>;

type SecSubmissions = {
  cik: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
};

type SecArchiveDirectory = {
  directory: {
    item: Array<{
      name: string;
      href?: string;
      size?: string;
      lastModified?: string;
    }>;
  };
};

type SecExhibit = {
  exhibit: string;
  label: string;
  url: string;
};

type NormalizedSecFiling = {
  accessionNoDashes: string;
  cikNoLeadingZeroes: string;
  externalId: string;
  ticker: string;
  companyName: string;
  formType: string;
  filedAt: Date | null;
  reportDate: Date | null;
  sourceUrl: string;
  title: string;
};

export type SecResearchSyncResult = {
  status: "synced" | "skipped";
  created: number;
  updated: number;
  skipped: number;
};

const provider = "SEC EDGAR";
const ownerEmail = "joachim@private-macro-desk.local";
const DEFAULT_TICKERS = "AAPL,MSFT,NVDA,TSLA,META,AMZN,GOOGL";
const DEFAULT_FORMS = "10-K,10-Q,8-K,DEF 14A";

export async function syncSecResearchDocuments(): Promise<SecResearchSyncResult> {
  const userAgent = process.env.SEC_USER_AGENT;

  if (!userAgent) {
    console.warn("[Research scheduler] SEC_USER_AGENT missing; SEC EDGAR refresh skipped.");
    return { status: "skipped", created: 0, updated: 0, skipped: 0 };
  }

  const tickers = parseList(process.env.SEC_RESEARCH_TICKERS ?? DEFAULT_TICKERS);
  const forms = new Set(parseList(process.env.SEC_RESEARCH_FORMS ?? DEFAULT_FORMS));
  const limitPerTicker = Number(process.env.SEC_RESEARCH_LIMIT_PER_TICKER ?? "12");
  const uploadedById = await getSyncUserId();

  if (tickers.length === 0) {
    throw new Error("SEC_RESEARCH_TICKERS is empty.");
  }

  const tickerDirectory = await fetchSecJson<SecCompanyTickers>("https://www.sec.gov/files/company_tickers.json", userAgent);
  const byTicker = new Map(
    Object.values(tickerDirectory).map((entry) => [entry.ticker.toUpperCase(), entry]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ticker of tickers) {
    const company = byTicker.get(ticker.toUpperCase());

    if (!company) {
      console.warn(`[Research scheduler] Skipped ${ticker}: ticker not found in SEC directory.`);
      skipped += 1;
      continue;
    }

    const cik = String(company.cik_str).padStart(10, "0");
    const submissions = await fetchSecJson<SecSubmissions>(`https://data.sec.gov/submissions/CIK${cik}.json`, userAgent);
    const rows = normalizeRecentFilings(submissions, company.ticker, company.title, forms).slice(0, limitPerTicker);

    for (const row of rows) {
      const enriched = await enrichSecFiling(row, userAgent);
      const result = await upsertResearchDocument(enriched, uploadedById);
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }
  }

  return { status: "synced", created, updated, skipped };
}

async function upsertResearchDocument(
  row: NormalizedSecFiling & ReturnType<typeof getResearchLabels> & { secItems: string[]; exhibits: SecExhibit[] },
  uploadedById: string,
) {
  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.researchDocument.findUnique({
    where: {
      provider_externalId: {
        provider,
        externalId: row.externalId,
      },
    },
    select: { id: true },
  });

  await prisma.researchDocument.upsert({
    where: {
      provider_externalId: {
        provider,
        externalId: row.externalId,
      },
    },
    create: {
      externalId: row.externalId,
      provider,
      ticker: row.ticker,
      companyName: row.companyName,
      formType: row.formType,
      filedAt: row.filedAt,
      reportDate: row.reportDate,
      sourceUrl: row.sourceUrl,
      secItems: row.secItems,
      exhibits: row.exhibits,
      importance: row.importance,
      category: row.category,
      summary: row.summary,
      title: row.title,
      type: DocumentType.FILING,
      source: provider,
      fileUrl: row.sourceUrl,
      uploadedById,
    },
    update: {
      companyName: row.companyName,
      formType: row.formType,
      filedAt: row.filedAt,
      reportDate: row.reportDate,
      sourceUrl: row.sourceUrl,
      secItems: row.secItems,
      exhibits: row.exhibits,
      importance: row.importance,
      category: row.category,
      summary: row.summary,
      title: row.title,
      source: provider,
      fileUrl: row.sourceUrl,
    },
  });

  return existing ? "updated" : "created";
}

function normalizeRecentFilings(
  submissions: SecSubmissions,
  ticker: string,
  fallbackCompanyName: string,
  forms: Set<string>,
) : NormalizedSecFiling[] {
  const recent = submissions.filings.recent;
  const rows = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const formType = recent.form[index];
    const accessionNumber = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument[index];

    if (!forms.has(formType) || !accessionNumber || !primaryDocument) continue;

    const cikNoLeadingZeroes = String(Number(submissions.cik));
    const accessionNoDashes = accessionNumber.replaceAll("-", "");
    const sourceUrl = `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeroes}/${accessionNoDashes}/${primaryDocument}`;
    const companyName = submissions.name || fallbackCompanyName;
    const reportDate = parseSecDate(recent.reportDate[index]);

    rows.push({
      accessionNoDashes,
      cikNoLeadingZeroes,
      externalId: `${submissions.cik}-${accessionNumber}`,
      ticker: ticker.toUpperCase(),
      companyName,
      formType,
      filedAt: parseSecDate(recent.filingDate[index]),
      reportDate,
      sourceUrl,
      title: `${companyName} ${formType}${reportDate ? ` / ${recent.reportDate[index]}` : ""}`,
    });
  }

  return rows;
}

async function enrichSecFiling(row: NormalizedSecFiling, userAgent: string) {
  let secItems: string[] = [];
  let exhibits: SecExhibit[] = [];

  if (row.formType === "8-K") {
    const [documentText, archiveDirectory] = await Promise.all([
      fetchSecText(row.sourceUrl, userAgent).catch(() => ""),
      fetchSecJson<SecArchiveDirectory>(
        `https://www.sec.gov/Archives/edgar/data/${row.cikNoLeadingZeroes}/${row.accessionNoDashes}/index.json`,
        userAgent,
      ).catch(() => null),
    ]);

    secItems = extractSecItems(documentText);
    exhibits = extractExhibits(archiveDirectory, row.cikNoLeadingZeroes, row.accessionNoDashes);
  }

  return {
    ...row,
    secItems,
    exhibits,
    ...getResearchLabels(row, secItems, exhibits),
  };
}

function getResearchLabels(row: NormalizedSecFiling, secItems: string[] = [], exhibits: SecExhibit[] = []) {
  const company = row.companyName;

  if (row.formType === "10-K") {
    return {
      category: "Annual reports",
      importance: "High",
      summary: `${company} filed its annual report. Prioritize business overview, risk factors, MD&A and audited financials.`,
    };
  }

  if (row.formType === "10-Q") {
    return {
      category: "Quarterly reports",
      importance: "High",
      summary: `${company} filed its quarterly report. Prioritize revenue trends, margin changes, liquidity and updated risks.`,
    };
  }

  if (row.formType === "DEF 14A") {
    return {
      category: "Proxy / Governance",
      importance: "Governance",
      summary: `${company} filed a proxy statement. Useful for governance, compensation and shareholder vote context.`,
    };
  }

  if (row.formType === "8-K") {
    const isEarnings = secItems.includes("2.02");
    const exhibit991 = exhibits.find((exhibit) => exhibit.exhibit === "99.1");
    const itemText = secItems.length > 0 ? `Item ${secItems.join(", Item ")}` : "an unspecified 8-K item";
    const attachmentText = exhibit991
      ? " Main useful attachment: Exhibit 99.1 press release."
      : exhibits.length > 0
        ? ` Main useful attachment: Exhibit ${exhibits[0].exhibit}.`
        : " No useful exhibit was detected yet.";

    return {
      category: isEarnings ? "Earnings" : "Material events",
      importance: isEarnings ? "High" : "Medium",
      summary: `${company} filed an 8-K related to ${describeItems(secItems) || itemText}.${attachmentText}`,
    };
  }

  return {
    category: "Official filing",
    importance: "Medium",
    summary: `${company} filed ${row.formType}. Open the SEC source to review the document.`,
  };
}

function extractSecItems(text: string) {
  const normalized = stripHtml(text).replace(/&nbsp;/gi, " ");
  const matches = new Set<string>();
  const itemPattern = /Item\s+([0-9]{1,2}\.[0-9]{2})/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(normalized)) !== null) {
    matches.add(match[1]);
  }

  return [...matches].sort();
}

function extractExhibits(
  archiveDirectory: SecArchiveDirectory | null,
  cikNoLeadingZeroes: string,
  accessionNoDashes: string,
) {
  if (!archiveDirectory) return [];

  return archiveDirectory.directory.item
    .map((item): SecExhibit | null => {
      const exhibit = parseExhibitNumber(item.name);
      if (!exhibit || !exhibit.startsWith("99")) return null;

      return {
        exhibit,
        label: exhibit === "99.1" ? "Press release" : `Exhibit ${exhibit}`,
        url: `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeroes}/${accessionNoDashes}/${item.name}`,
      };
    })
    .filter((item): item is SecExhibit => item !== null)
    .sort((left, right) => left.exhibit.localeCompare(right.exhibit));
}

function parseExhibitNumber(name: string) {
  const normalized = name.toLowerCase();
  const match = normalized.match(/(?:ex-|exhibit)?(99(?:\.\d+)?)/i);
  return match?.[1] ?? null;
}

function describeItems(items: string[]) {
  if (items.includes("2.02")) return "results of operations";
  if (items.includes("1.01")) return "a material definitive agreement";
  if (items.includes("2.01")) return "completion of an acquisition or disposition";
  if (items.includes("5.02")) return "management or board changes";
  if (items.includes("7.01")) return "regulation FD disclosure";
  if (items.includes("8.01")) return "other material events";
  return "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
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

async function fetchSecJson<T>(url: string, userAgent: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`SEC request failed ${response.status}: ${url}`);
  }

  return response.json() as Promise<T>;
}

async function fetchSecText(url: string, userAgent: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`SEC request failed ${response.status}: ${url}`);
  }

  return response.text();
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function parseSecDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
